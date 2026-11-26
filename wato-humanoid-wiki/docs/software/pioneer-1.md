---
id: pioneer-1
title: Pioneer-1 Manipulation
description: Pioneer-1, our language-conditioned flow-matching policy. It picks the object named in the prompt and puts it in the bowl, and replans with real-time chunking.
sidebar_position: 2.7
---

# Pioneer-1 Manipulation

**Pioneer-1** is our own manipulation policy (the model, not the robot). You give it camera images, the arm's joint state and an instruction such as "put the green lion in the red bowl" or "put the fire truck in the red bowl", and it outputs the next joint targets for the arm. The clips below are successes on table layouts it never saw in training.

It is a flow-matching transformer: a pretrained vision encoder reads every camera, the instruction steers what the encoder's tokens mean, and an action head turns random noise into a chunk of 32 actions in 10 steps. It has 256M parameters, 193M of them trained, so it trains on a 16 GB GPU and is small enough to run on board (Jetson-class).

## Without RTC

![](/img/humanoid/videos/ditx-prompted-pick-place.mp4)

## With Async RTC

![](/img/humanoid/videos/ditx-prompted-pick-place-async-rtc.mp4)

With async RTC (real-time chunking), the motion is clearly smoother. [Replanning](#replanning-with-real-time-chunking) below explains why.

## How Pioneer-1 is built

![Diagram of Pioneer-1. The scene camera and the wrist cameras go through one DINOv3 ViT-B/16 encoder; the instruction goes through a frozen CLIP text encoder, whose sentence embedding scales and shifts every visual token (FiLM) and whose word tokens join the context; the joint state becomes one token. Two fusion layers mix the context. The action head, a 6-block transformer conditioned on the flow time, cross-attends to the context and turns a noisy 32-action chunk into actions over 10 Euler steps](/img/humanoid/pioneer-1/pioneer-1-architecture.svg)
*Figure 1: Pioneer-1. The context encoder (left) turns the cameras, the instruction and the joint state into context tokens; the action expert (right) cross-attends to them while it turns noise into a 32-action chunk.*

### What the policy sees

- **Cameras.** One **DINOv3 ViT-B/16** encodes every camera at 224×224. It is fine-tuned with the policy, at a tenth of the learning rate of the rest. The scene camera (`ego`) keeps all of its tokens: the class token, 4 register tokens and all 196 patches. Each wrist camera keeps its class and register tokens plus its patch grid average-pooled to 7×7, so 54 tokens. The scene camera needs the detail to find the right object; the wrists mostly need to see how close the gripper is.
- **Instruction.** A frozen **CLIP** text encoder reads the prompt. It is used twice:
  - Its sentence embedding drives **FiLM**: every visual token is scaled and shifted, `(1 + γ) · z + β`, with γ and β computed from the sentence. FiLM's last layer starts at zero, so training begins with the images untouched.
  - Its word tokens are projected and added to the context as tokens of their own.
- **Joint state.** The 8 joint values (7 joints and the gripper) go through one linear layer and become a single state token.
- **Fusion layers.** Two self-attention layers run over the whole context: visual, word and state tokens together. FiLM can only apply one scale and shift per channel to every patch at once. Here each image patch can look at the words directly, which lets the model mark *which* patch holds the lion.

### The action head

The action head is a flow-matching transformer. It starts from a chunk of 32 random actions and, over 10 Euler steps, moves the chunk toward real actions. At each step it predicts a velocity, the direction from noise to actions, and the chunk moves a tenth of the way along it.

Each of its 6 blocks does three things:

1. **Self-attention over the 32 actions**, with rotary positions, so each action fits with the ones before and after it.
2. **Cross-attention to the context**, which is how the actions see the cameras, the instruction and the joint state.
3. **A feed-forward layer.**

The flow time t (0 for pure noise, 1 for clean actions) conditions every block through **adaLN-Zero**: it scales, shifts and gates each of the three sublayers. The gates start at zero, so each block starts as the identity. Each action token has its own t, which is what makes real-time chunking work, below.

### Training

Training follows the usual flow-matching recipe: take a demo's real 32-action chunk, mix it with noise at a random time t, and train the head to predict the velocity from the noise to the real actions.

Real-time chunking is built into training. In each sample, a random number of the chunk's first actions (0 to 6) are given clean, with flow time 1, and left out of the loss. The model learns to continue a chunk whose start is already fixed, which is exactly what it does at run time.

Training also applies small random crops, rotations of up to 5° and colour jitter to every image.

## Replanning with real-time chunking

Each chunk plans 32 actions (1.28 s at 25 Hz), but the arm runs only the first 16 before Pioneer-1 looks at the cameras again and plans a new chunk. Replanning halfway means it reacts to what it sees twice as often.

The catch is that a fresh chunk can disagree with the one the arm is in the middle of, and the switch shows up as a jolt. So the new chunk starts from the **6 actions the old chunk had planned next**. Those 6 are held fixed during sampling (flow time 1, zero velocity), and the model fills in the remaining 26 so they continue the motion already under way.

![Timeline of two chunks. Chunk k is planned at step 0; its first 16 actions are executed, its actions 17 to 22 are copied, and the rest are thrown away. Chunk k+1 is planned at step 16 and starts with those 6 copied actions as a fixed prefix, then executes its next 10 actions](/img/humanoid/pioneer-1/pioneer-1-replanning.svg)
*Figure 2: Replanning every 16 actions. The 6 actions chunk k planned next become the fixed start of chunk k+1, so consecutive chunks join up.*

Both settings come from the evaluations below. Running whole 32-action chunks scored worse, and replanning *without* the kept actions broke the motion completely.

## Results

The task: two objects on a table and a bowl, and the instruction names which object to put in the bowl. The policy was trained on 600 synthetic tabletop-pick demos and evaluated on layouts the demos never used.

| Setting | Successes |
|---------|-----------|
| **Pioneer-1, defaults** (replan every 16, keep 6, no EMA), 40k steps | **140 / 200 (70%)** |
| Whole 32-action chunks, no replanning | 136 / 300 |
| Replan every 16, keep 6 | 165 / 300 |
| Replan every 8, no kept actions | 12 / 100 |
| EMA weights (0.999) instead of the trained weights | 111 / 200 |
| π₀.5, full fine-tune (3.6B, pretrained) | 154 / 200 |

- **No EMA.** Averaging the weights (EMA) did worse than using the trained weights directly: better on 5 layouts, worse on 34. Most likely the averaged weights blur the choice between options (which object, when to close the gripper), so the arm hesitates. EMA is off by default.
- **Training longer doesn't help.** 60k steps did no better than 40k. A step takes 0.37 s on an L40S at batch 32.
- **Against π₀.5.** A full π₀.5 fine-tune on the same demos scores 154/200 on the same layouts. It is better on 37 layouts and worse on 23 (p ≈ 0.09), so not clearly better, and it is 14× larger: it needs an 80 GB GPU to fine-tune, where Pioneer-1 trains on 16 GB.

### How it fails

Most failures either never grasp (the arm stalls near its start) or take the other object. Few drop the object on the way to the bowl. The likely limit is the data: the scripted demos never retry or correct a mistake, so the policy has never seen how to recover.

## Code

Pioneer-1 lives in the humanoid repo under [`src/robot_learning/humanoid_robot_learning/policies/pioneer1`](https://github.com/WATonomous/pioneer_humanoid/tree/main/src/robot_learning/humanoid_robot_learning/policies/pioneer1), added in [WATonomous/pioneer_humanoid#570](https://github.com/WATonomous/pioneer_humanoid/pull/570). It is a LeRobot policy (`--policy.type=pioneer1`) and trains on any dataset in the [robot learning README](https://github.com/WATonomous/pioneer_humanoid/blob/main/src/robot_learning/README.md)'s format. The same architecture also folds clothes: see [Cloth Folding](./cloth-folding).

The architecture is still changing, and the model needs more training and better data.
