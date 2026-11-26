---
id: data-collection
title: Data Collection
description: The light-box workspace used to collect manipulation data.
sidebar_position: 2.5
---

# Data Collection

The light-box workspace used to collect manipulation data for learning.

:::gallery
![Manipulation data collection light box](/img/humanoid/lightbox-workspace-1.jpg)
![Manipulation data collection light box, alternate angle](/img/humanoid/lightbox-workspace-2.jpg)
:::

The same light box is modelled in simulation, matching the real one, in both Isaac Lab (left) and MuJoCo (right).

:::gallery 2
![The light box modelled in Isaac Lab](/img/humanoid/lightbox-sim-isaaclab.png)
![The light box modelled in MuJoCo](/img/humanoid/lightbox-sim-mujoco.png)
:::

A recorded take from the light box: the arm picks up the cube and drops it in the bin. Left, the recorded camera view; right, the real arm doing the task, filmed from outside.

:::gallery 64fr 27fr
![](/img/humanoid/videos/lightbox-take-cube-into-bin.mp4)
![](/img/humanoid/videos/lightbox-real-arm-cube-into-bin.mp4)
:::

## Dataset format

Demos are saved as [LeRobot](https://github.com/huggingface/lerobot) datasets at 25 fps. Each frame has:

| Field | Content |
|-------|---------|
| `observation.state` | measured joint positions (rad) and gripper closure (0 open, 1 closed) |
| `action` | commanded joint targets and gripper command |
| `observation.images.<camera>` | 640×480 RGB: `ego`, `wrist_left`, `wrist_right` |
| `task` | the instruction, e.g. "put the vial in the rack" |

Each arm gives 8 values, left arm first: `shoulder_pitch`, `shoulder_roll`, `shoulder_yaw`, `elbow`, `forearm_roll`, `wrist_pitch`, `wrist_yaw`, `gripper`. Datasets are named `pioneer_8dof_left_arm`, `_right_arm` or `_bimanual`.

Today's real arm is the old 6-DoF arm, with 7 values per arm (`elbow_pitch` and `elbow_roll` instead of `elbow` and `forearm_roll`, and no `wrist_yaw`). Its datasets are `pioneer_v1_*` and never mixed with 8-DoF data.

Schemas: [`pioneer_8dof_dataset_schema.yaml`](https://github.com/WATonomous/pioneer_humanoid/blob/main/src/robot_learning/config/pioneer_8dof_dataset_schema.yaml) and [`pioneer_humanoid_dataset_schema.yaml`](https://github.com/WATonomous/pioneer_humanoid/blob/main/src/robot_learning/config/pioneer_humanoid_dataset_schema.yaml).

## UMI Gripper

A second way to collect data: a handheld [UMI](https://umi-gripper.github.io/) (Universal Manipulation Interface) gripper with fin ray fingers. Demos are recorded by hand, without the robot, which makes data collection much easier to scale.

:::gallery 9fr 12fr 12fr
![](/img/humanoid/videos/umi-gripper-open-close.mp4)
![The handheld UMI gripper](/img/humanoid/umi-gripper-handheld.jpg)
![The UMI gripper holding a plush toy](/img/humanoid/umi-gripper-grasp.jpg)
:::
