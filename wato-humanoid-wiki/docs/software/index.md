---
id: index
title: Software & ML
description: Software and machine learning documentation for the WATonomous Humanoid.
---

# Software & Machine Learning

## Bimanual Arm Inverse Kinematics

<video width="600" controls>
  <source src="/humanoid-docs/img/humanoid/videos/ik-bimanual-arm.mp4" type="video/mp4" />
</video>

Jacobian-based iterative IK for the dual-arm setup, driving both end effectors to target poses in simulation.

## 6 DOF Arm + 15 DOF Hand Jacobian Iterative Based IK Controller

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/02b19410-c39e-403a-9bea-164c5141f61f" type="video/mp4" />
</video>

### Inverse kinematics: `fingertip_ik.py`

We implemented **iterative Jacobian IK with damped least squares (DLS)** to take in the 5 target fingertip position and outputting the joint angle that will make it happen. It utilize the Jacobians and body positions from MuJoCo for computation, and Isaac Sim for visualization.

### Algorithm

Joint Position is $\mathbf{q} \in \mathbb{R}^{n_v}$ (where $n_v = 21$, representing the 21 DOF, specfically `model.nv` is the dimension of the joint velocity). Targets are world positions for the five fingertip bodies (`targets` dict). **Only fingertip positions** are constrained (`jacp` from `mj_jacBody`; `jacr`, the fingertip orientaton, is unused).

#### Iteration loop

Repeat up to `max_iter` times / return early if error lower than `tol` tolerance:

1. **`mj_forward(model, data)`** — compute forward kinematics with mujoco function
2. **Build error $\mathbf{e}$** — for each fingertip that has a target, compute its error, `err = target - pos`; concatenate into one vector.

   For fingertip $i$:

   $$
   \mathbf{e}_i = \mathbf{p}_i^{\ast} - \mathbf{p}_i(\mathbf{q}) \in \mathbb{R}^3.
   $$

   Stacking $m$ fingertips:

   $$
   \mathbf{e} =
   \begin{bmatrix}
   \mathbf{e}_1 \\ \vdots \\ \mathbf{e}_m
   \end{bmatrix}
   \in \mathbb{R}^{3m}.
   $$
3. **Convergence check** — if $\max |\mathbf{e}| < \text{tol}$, exit early successfully.
4. **Build Jacobian `J`** — for each such fingertip, `mj_jacBody` → translation Jacobian `jacp`; `vstack` into `J`.

   Translation-only linearization for fingertip $i$:

   $$
   \mathrm{d}\mathbf{p}_i \approx \mathbf{J}_i\,\mathrm{d}\mathbf{q},
   \qquad
   \mathbf{J}_i \in \mathbb{R}^{3 \times n_v}.
   $$

   Stacking:

   $$
   \mathbf{J} =
   \begin{bmatrix}
   \mathbf{J}_1 \\ \vdots \\ \mathbf{J}_m
   \end{bmatrix}
   \in \mathbb{R}^{3m \times n_v}.
   $$

5. **Damped least squares** — solve for a joint increment `dq` using damped least squares with $\lambda =$ `damping`.

   Compute $\Delta\mathbf{q}$ that minimizes (**formalizing the optimization problem**)

   $$
   \min_{\Delta\mathbf{q}} \;
   \bigl\|\mathbf{J}\,\Delta\mathbf{q} - \mathbf{e}\bigr\|_2^2
   + \lambda\bigl\|\Delta\mathbf{q}\bigr\|_2^2.
   $$

   The minimizer satisfies the normal equations (The **actual equation that we need to solve**)

   $$
   \bigl(\mathbf{J}^{\mathsf T}\mathbf{J} + \lambda \mathbf{I}\bigr)\,\Delta\mathbf{q}
   = \mathbf{J}^{\mathsf T}\mathbf{e}.
   $$
6. **Update** — `qpos[:nv] += step * dq` (i.e. $\mathbf{q} \leftarrow \mathbf{q} + \alpha\,\Delta\mathbf{q}$, $\alpha =$ `step`).
7. **Joint limits** — if `clip_limits`, run `clip_to_joint_limits`, enforce joint limit

**Return value**: new joint pos, boolean on whether it successfully converge with error under `tol`, max error

**Defaults:** `damping=1e-4`, `step=0.5`, `max_iter=200`, `tol=1e-4`, `clip_limits=True`.


## VR Teleoperation

Meta Quest hand tracking drives both arms of the bimanual rig in real time, in either Isaac Sim or (left arm only, gated) on the physical robot. The pipeline is split across a browser-side WebXR page, a C++ ROS 2 bridge, and a Python IK driver, all running inside the `simulation_isaac` container:

<video width="300" controls>
  <source src="/humanoid-docs/img/humanoid/videos/quest-vr-teleop.mp4" type="video/mp4" />
</video>

```
Quest 2 headset (WebXR hand tracking, Meta Browser)
    │  HTTPS :8443 / WSS :9090  (adb reverse USB tunnels — no Wi-Fi needed)
    ▼
webxr_server.py  ────────────────────────────┐
  serves static/index.html + self-signed cert │
                                              │
quest_teleop_node  (C++, Boost.Beast WSS)     │
  parses JSON → common_msgs/QuestHandPose     │
    │  publishes /quest_teleop @ ~30 Hz       │
    ▼                                         │
run_quest_bimanual_teleop.py                  │
  DifferentialIKController (DLS), per arm,    │
  targets each gripper's fingertip-tip frame  │
    │                                         │
    ▼                                         │
Isaac Sim 5.1 ◄───────────────────────────────┘  (stereo POV rendered back to headset)
```

### Browser → ROS 2 bridge

`static/index.html` uses the WebXR Device API to read the headset's wrist poses and per-joint hand-tracking data every frame, and sends a JSON payload over a secure WebSocket:

```json
{
  "left_wrist":  { "position": {x,y,z}, "orientation": {x,y,z,w} },
  "right_wrist": { "position": {x,y,z}, "orientation": {x,y,z,w} },
  "head_pose":   { "position": {x,y,z}, "orientation": {x,y,z,w} },
  "left_hand_joints":  [75 floats],
  "right_hand_joints": [75 floats]
}
```

Each hand array is 25 WebXR joints × 3 (x, y, z) = 75 floats. `quest_teleop_node` (`autonomy/teleop/quest_teleop`) runs a TLS WebSocket server on port `9090` (`WssServer`, Boost.Beast) — one thread per connection. Every inbound text frame is handed to `QuestMessageParser::parse`, which fills a `common_msgs/msg/QuestHandPose` (defaults to identity orientation / zero position for any field the payload omits) and publishes it on `/quest_teleop`. An untracked hand shows up as the sentinel zero-position + identity-orientation pose — the sim side checks for this explicitly (`_is_tracked`) rather than trusting every message.

`webxr_server.py` is a plain `ThreadingHTTPServer` wrapped in TLS that serves `static/` (the WebXR page) on port `8443`. Both ports are reached from the headset via `adb reverse` USB tunnels, so no network/Wi-Fi setup is required, and the self-signed cert has to be trusted separately on each port in the Meta Browser before the socket will connect.

### Sim-side IK driver

`autonomy/simulation/quest_isaac_teleop/run_quest_bimanual_teleop.py` runs inside Isaac Lab and drives both arms independently:

- **One `DifferentialIKController` per arm** (`ik_method="dls"`, damped least squares), each tracking its gripper's **fingertip-tip frame** (midpoint of the two finger distal tips) rather than the raw wrist link, so grasp point tracking stays accurate regardless of gripper orientation.
- **Homing on first tracked sample** — each arm independently latches its Quest-wrist home pose the instant tracking starts, anchored to the arm's fixed rest pose (not wherever the tip currently sits, which would bake in IK lag). Pressing `R` (Isaac Sim window focused) re-homes both arms to the operator's current wrist pose, for mid-session recalibration.
- **Coordinate remap** — WebXR is Y-up (X-right, Y-up, −Z-forward); the robot's world frame is Z-up. `_QUEST_TO_WORLD` is a fixed 3×3 rotation (must stay determinant +1, or `quat_from_matrix` silently corrupts orientation) mapping one to the other, with a separate per-arm `_AXIS_SIGN_LEFT`/`_AXIS_SIGN_RIGHT` for flipping individual axes without touching that matrix.
- **Ramped gain + reach clamp** — displacement from the home pose is scaled by `_ramped_gain` (smoothstep from 1.0 down as displacement shrinks) and hard-clamped to `_MAX_REACH_M` (0.28 m) so small hand jitter near rest doesn't overshoot and large reaches can't exceed the arm's safe envelope.
- **DLS damping tuned per arm** — `lambda_val = 0.2` (left) / `0.35` (right). At the DLS default (0.01) a ~0.1 m commanded displacement pushed the Jacobian condition number from ~60 to 4000+, with some axes diverging instead of converging; the tuned values keep the condition number bounded and convergence stable. The right arm needs more damping because its rest pose (measured independently, not mirrored from the left) has worse conditioning near full extension.
- **Pinch-to-grip** — thumb-tip-to-index-tip distance from the 75-float hand array drives a hysteresis gripper state: closes below 30 mm, opens above 50 mm, holds in between.
- **Stereo POV feed** — two RealSense D455 camera prims are mounted on the robot base (fixed pose; head tracking is wired but currently disabled) and periodically captured to `pov_left.png`/`pov_right.png`, served back to the headset as the in-VR view.

### Real-hardware bridge (left arm only)

Passing `--publish-real-left-arm` additionally publishes the left arm's live DLS joint solution to `/behaviour/arm_pose`, so `joint_command_node` drives the physical left arm over CAN in lockstep with the sim. It's off by default — normal sessions are sim-only. The right arm has no CAN ID mapping in `hardware_mapping.yaml` yet, so this flag cannot touch it.

Because `joint_command_node` applies no rate-limiting to the very first `ArmPose` message after startup, an immediate publish could snap the real arm from its physical position straight to the sim's current IK target. A **5-second startup delay** (`_REAL_ARM_PUBLISH_START_DELAY_S`) holds off all publishing so a human can manually position the real arm near the sim's rest pose first; publishing is then throttled to 50 Hz to match `joint_command_node`'s control rate. Real-hardware sessions require the CANable adapter connected, `can_node` + `joint_command_node` already running, an e-stop armed, and a human physically present at the e-stop for the entire first test.

### Controls

| Action | Effect |
| --- | --- |
| Move right / left wrist | Corresponding arm follows |
| Pinch thumb + index (either hand) | Corresponding gripper closes / opens |
| `R` (Isaac Sim window focused) | Recalibrate — re-home both arms to current wrist pose |
| `--gain VALUE` (default `1.0`) | Scales arm motion per metre of real wrist motion |

## Reinforcement Learning

### In-Hand Manipulation RL Task

<video width="600" controls>
  <source src="/humanoid-docs/img/humanoid/videos/inhand_rl.mp4" type="video/mp4" />
</video>

Reinforcement learning-based in-hand cube reorientation task for the 16 DOF Wato hand in Isaac Lab. The policy learns to reorient a DexCube held in the palm toward commanded goal orientations using PPO (Proximal Policy Optimization).

#### Task Setup

| Parameter | Value |
| --- | --- |
| Robot | 16 DOF Wato hand (palm-up orientation) |
| Object | Isaac Nucleus DexCube, scale (0.8, 0.8, 0.8) |
| Goal command | Reorientation command, resampled on success |
| Success threshold | Orientation error < 0.4 rad |
| Episode length | 20 seconds |
| Number of environments | 2048 (default) |
| Simulation frequency | 120 Hz |
| Action decimation | 4 |

#### Reward Structure

The reward function combines task objectives with regularization penalties:

| Category | Term | Weight | Description |
| --- | --- | --- | --- |
| **Task Rewards** | Position tracking | -3.0 | L2 distance to goal position (hold in palm) |
| | Orientation tracking | 10.0 | Dense rotation signal: $1 / (\text{error} + 0.1)$ |
| | Success bonus | 50.0 | Binary reward when error < 0.4 rad |
| | Object held bonus | 0.5 | +1/step when cube within 0.10 m of goal |
| | Angular velocity toward goal | 0.2 | Reward cube spin aligned with goal |
| | Spread activity | 0.03 | Encourages finger abduction (Wato hand) |
| **Penalties** | Object away penalty | -5.0 | Terminal penalty when out of reach |
| | Action rate L2 | -0.05 | Penalize jerky commands |
| | Joint velocity L2 | $-1 \times 10^{-4}$ | Penalize high joint speeds |
| | Action L2 | $-1 \times 10^{-4}$ | Penalize large action magnitudes |

#### Termination Conditions

| Condition | Threshold |
| --- | --- |
| Time out | Episode length > 20 seconds |
| Max consecutive success | 50 successful reorientations in one episode |
| Object out of reach | Cube drifts > 0.3 m from robot root |
| Orientation stagnation | Error stays > 0.5 rad for 150 consecutive steps |

#### Training Details

- **Algorithm**: PPO with GAE (Generalized Advantage Estimation)
- **Gamma**: 0.998
- **Entropy coefficient**: 0.0001
- **Steps per environment**: 48
- **Action smoothing**: EMA joint-position targets, alpha = 0.85
- **Max iterations**: 5000

The task is implemented in Isaac Lab and adapted from their in-hand manipulation examples. Checkpoints are saved to `logs/rsl_rl/wato_hand_cube/`.

### Additional RL Demonstrations

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/1d998015-7e5d-4d95-a16e-5a038e604794" type="video/mp4" />
</video>

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/80bf81cc-a531-469d-bf8f-33957ce153b9" type="video/mp4" />
</video>

### Locomotion RL

Reinforcement learning-based locomotion training.

<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
  <video width="380" controls>
    <source src="/humanoid-docs/img/humanoid/videos/locomotion-rl-1.mp4" type="video/mp4" />
  </video>
  <video width="380" controls>
    <source src="/humanoid-docs/img/humanoid/videos/locomotion-rl-2.mp4" type="video/mp4" />
  </video>
  <video width="380" controls>
    <source src="/humanoid-docs/img/humanoid/videos/locomotion-rl-3.mp4" type="video/mp4" />
  </video>
</div>

### Manipulation Task Setup

Parallelized manipulation task environments for RL training.

<img alt="Manipulation task setup, parallel environments" src="/humanoid-docs/img/humanoid/manipulation-task-setup.png" width="700" />

## Geometric Fabrics PCA

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/4661eef0-f966-4c65-83d6-3216d7fb3177" type="video/mp4" />
</video>

### Goal

Control a 21-DOF humanoid arm+hand using **geometric fabrics** — a control framework that's fast and stable without needing to solve an optimization problem every step.

The fingers have 15 joints, too many to command directly. So we use **PCA** to compress them to 7 numbers. PCA is trained on real human hand poses and learns the 7 directions that capture most of the variation in finger motion. You give it a 7-number command and it maps back to 15 joint angles via `q_hand = W @ z + μ` — just a change of coordinates. `z` is your 7D input, `W` maps it to joint space, and `μ` is the mean pose so that `z = 0` gives you a natural resting hand.

### Files

| File | Purpose |
|------|---------|
| `compute_pca.py` | Trains PCA from the HUST hand motion dataset, saves matrix/mean/bounds |
| `humanoid_hand_pose_fabric.py` | Core controller — builds all the fabric layers (arm, hand, collision, joint limits) |
| `run_example.py` | Runs the simulation loop at 60 Hz, renders optionally |
| `humanoid_hand_params.yaml` | All the tunable params — gains, collision spheres, joint limits |
| `pca_matrix.npy`, `pca_mean.npy`, `pca_score_*.npy` | Trained PCA files loaded at runtime |
| `FABRICS/` | NVIDIA geometric fabrics framework (submodule) |

### How It Works

Every step, four layers each compute forces and sum them together:

1. **Arm attractor** — holds the arm at a fixed default config (arm doesn't move)
2. **Finger attractor** — takes the 7D PCA command, maps to 15 finger joints, pulls toward them
3. **Body repulsion** — 21 spheres on the robot links push away from obstacles
4. **Joint limit repulsion** — pushes back when joints get near their limits

All of that sums into `qdd = -M⁻¹ f`, which gets integrated to get the next joint state.
