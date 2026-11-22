---
id: vr-teleoperation
title: VR Teleoperation
description: Driving Pioneer's bimanual arms in simulation with Meta Quest controllers, and recording the takes as training data.
sidebar_position: 2
---

# VR Teleoperation

:::gallery 1.15fr 1fr
![](/img/humanoid/videos/quest-teleop-bowling.mp4)
![](/img/humanoid/videos/quest-teleop-drawer-stow.mp4)
:::

We used the Meta Quest 2/3 handheld controllers to teleop the 16 DOF bimanual arm in collecting dataset in MuJoCo, Isaac Sim or on the real humanoid arm, with minimal latency. The headset is primarily used for tracking the controller's locations so that IK can drive Pioneer's arm to follow it.

- **Bowling:** stand three fallen blocks back up
- **Drawer stow:** open the drawer, put three blocks in one by one and then close it.

## Controls

| Input | Action |
| --- | --- |
| Controller motion | Moves the arm |
| Index trigger | Closes the gripper, proportionally |
| Hold A / X | Precision mode: 25% translation and rotation |
| Left Y | Reset the scene, arms and grippers |
| Right B | Start or save a recorded take |

If tracking drops for more than 200 ms the arm pauses, then picks back up from where it is, so it never jumps.

## How It Works

Headset → pose stream → input filter → target → IK → motors.

- **Input filter:** a 1-euro filter on each controller pose to make movement smoother
- **IK:** one mink QP per tick, wrist position first, gripper orientation second. Joint limits and joint speed caps are imposed as hard constraints, and the elbow stays at least 10° bent to avoid the straight-arm singularity.
- **Motors:** position PD plus velocity and gravity feedforward, matching the real motors' MIT mode, so the sim arm doesn't lag its command.

## Recording Training Data

With recording on, each take becomes a LeRobot dataset episode: both arms' joints and grippers at 25 fps, plus the ego and both wrist cameras at 640×480. Multi-step tasks like drawer stow label every frame with the current step's instruction ("open the drawer", "put the red block in the drawer", ...), so a policy trained on it can potentially be prompted the same way.

Code: [`src/teleop/quest_controller_teleop`](https://github.com/WATonomous/pioneer_humanoid/tree/main/src/teleop/quest_controller_teleop)
