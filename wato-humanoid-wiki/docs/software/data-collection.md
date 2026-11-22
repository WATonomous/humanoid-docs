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

## UMI Gripper

A second way to collect data: a handheld [UMI](https://umi-gripper.github.io/) (Universal Manipulation Interface) gripper with fin ray fingers. Demos are recorded by hand, without the robot, which makes data collection much easier to scale.

:::gallery 9fr 12fr 12fr
![](/img/humanoid/videos/umi-gripper-open-close.mp4)
![The handheld UMI gripper](/img/humanoid/umi-gripper-handheld.jpg)
![The UMI gripper holding a plush toy](/img/humanoid/umi-gripper-grasp.jpg)
:::
