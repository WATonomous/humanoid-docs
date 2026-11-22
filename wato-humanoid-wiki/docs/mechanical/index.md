---
id: index
title: Mechanical
description: Mechanical design documentation for the WATonomous Humanoid robot.
---

# Mechanical

:::gallery
![Dual-arm render on test stand](/img/humanoid/dual-arm-stand-render.png)
:::

### 7 DOF Arm + 1 DOF Gripper — Motor Selection

For faster progress, we will be temporarily switching to attaching a gripper instead of the 15 DOF hands for the arm.

| Joint / Assembly | Motor | Rated Torque | Peak Torque |
| --- | --- | --- | --- |
| Shoulder (1-2) | AK10-9 V3.0 | 18Nm  | 53Nm  |
| Elbow (3-4-5) | AK80-9 V3.0 | 9Nm | 22Nm |
| Wrist yaw | AK45-10 V3.0 | 2.5 Nm | 7 Nm |
| Wrist pitch | AK45-10 V3.0 | 2.5 Nm | 7 Nm |
| Parallel Gripper | AK45-10 V3.0 | 2.5 Nm | 7 Nm |

Wrist and gripper torque ratings are per actuator, from CubeMars: [AK45-10 V3.0](https://www.cubemars.com/product/ak45-10-v3-0-kv75-robotic-actuator.html) and [AK40-10 KV170](https://www.cubemars.com/product/ak40-10-robotic-actuator.html). The AK40-10 is the standard, non-V3.0 model.

## Leader Arm

A wearable, bimanual leader arm for teleoperation: two arms that mirror Pioneer's joints, on a backpack frame, worn with shoulder straps. Each arm has 8 STS3215 servos, one per joint plus the gripper, with torque always off, so they only read angles. Each angle maps one-to-one onto the matching Pioneer joint, with no IK, from a shared zero: arm hanging straight down, gripper open.

![The wearable leader arm, worn on a backpack frame](/img/humanoid/leader-arm-wearable.jpg "width=50%")

## 22 DOF Hand

22 DOF hand (18 actuated), including 2 DOF for the wrist.

:::gallery
![22 DOF hand, palm view 2](/img/humanoid/hand-22dof-prototype-dorsal-mounted.jpg)
![22 DOF hand, dorsal view 2](/img/humanoid/hand-22dof-prototype-palm-mounted.jpg)
![22 DOF hand, palm view](/img/humanoid/hand-22dof-prototype-palm.jpg)
![22 DOF hand, dorsal view](/img/humanoid/hand-22dof-prototype-forearm.jpg)
:::

![](/img/humanoid/videos/tendon-hand-showcase.mp4)

:::gallery
![22 DOF hand render with forearm actuator stack](/img/humanoid/hand-22dof-render-1.png)
![22 DOF hand render, close-up of fingers and forearm actuators](/img/humanoid/hand-22dof-render-2.png)
:::

## Humanoid Leg

:::gallery
![Humanoid leg render, light background](/img/humanoid/leg-render-light.jpg)
![Humanoid leg render, dark background](/img/humanoid/leg-render-dark.png)
![Assembled humanoid leg prototype](/img/humanoid/leg-prototype-1.jpg)
![Assembled humanoid leg prototype with soccer ball](/img/humanoid/leg-prototype-ball.jpg)
:::

### 6 DOF Per Leg — Motor Selection

| Joint | DOF | Motor | Range (deg) |
| --- | --- | --- | --- |
| Hip | Pitch (Hip_F) | AKH70-48 | −20 to +90 |
| Hip | Yaw (Hip_R) | AK80-64 KV80 | −30 to +90 |
| Hip | Roll (Hip_A) | AK80-64 KV80 | −10 to +60 |
| Knee | Pitch | AKH70-48 | −65 to 0 |
| Ankle | Pitch (Ankle_P) | AK60-39 V3.0 KV80 | −30 to +50 |
| Ankle | Roll (Ankle_R) | AK60-39 V3.0 KV80 | −15 to +15 |

The ranges are the same on both legs. The whole robot: [Whole-Body Humanoid](./whole-body.md).

### Hip

The hip design uses the **F-A-R** (Flexion-Abduction-Rotation) configuration for a compact and biomimetic joint arrangement. This configuration allows for efficient packaging of the actuators while maintaining the necessary degrees of freedom for humanoid locomotion.
