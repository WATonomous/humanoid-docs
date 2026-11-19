---
id: index
title: Mechanical
description: Mechanical design documentation for the WATonomous Humanoid robot.
---

# Mechanical

<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
  <img alt="Dual-arm render on test stand" src="/humanoid-docs/img/humanoid/dual-arm-stand-render.png" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
</div>

### 8 DOF Arm + 1 DOF Gripper — Motor Selection

For faster progress, we will be temporarily switching to attaching a gripper instead of the 15 DOF hands for the arm.

| Joint / Assembly | Motor | Rated Torque | Peak Torque |
| --- | --- | --- | --- |
| Shoulder (1-2) | AK10-9 V3.0 | 18Nm  | 53Nm  |
| Elbow (3-4-5) | AK80-9 V3.0 | 9Nm | 22Nm |
| Wrist pitch (6) | AK45-10 V3.0 | 2.5 Nm | 7 Nm |
| Wrist yaw (7) | AK45-10 V3.0 | 2.5 Nm | 7 Nm |
| Wrist / forearm roll (8) | AK40-10 KV170 | 1.3 Nm | 4.1 Nm |
| Gripper | GL40 II KV82.5 | 0.25Nm | 0.73Nm |

The arm has eight DOF: two shoulder joints, three joints in the elbow group, and wrist pitch, yaw, and roll. The gripper adds one DOF.

Wrist torque ratings are per actuator, from CubeMars: [AK45-10 V3.0](https://www.cubemars.com/product/ak45-10-v3-0-kv75-robotic-actuator.html) and [AK40-10 KV170](https://www.cubemars.com/product/ak40-10-robotic-actuator.html). The AK40-10 is the standard, non-V3.0 model.

## 22 DOF Hand

22 DOF hand (18 actuated), including 2 DOF for the wrist.

<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
  <img alt="22 DOF hand, palm view 2" src="/humanoid-docs/img/humanoid/hand-22dof-prototype-dorsal-mounted.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="22 DOF hand, dorsal view 2" src="/humanoid-docs/img/humanoid/hand-22dof-prototype-palm-mounted.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="22 DOF hand, palm view" src="/humanoid-docs/img/humanoid/hand-22dof-prototype-palm.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="22 DOF hand, dorsal view" src="/humanoid-docs/img/humanoid/hand-22dof-prototype-forearm.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
</div>

<video width="600" controls style={{display: 'block', maxWidth: '100%', margin: '16px 0'}}>
  <source src="/humanoid-docs/img/humanoid/videos/tendon-hand-showcase.mp4" type="video/mp4" />
</video>

<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
  <img alt="22 DOF hand render with forearm actuator stack" src="/humanoid-docs/img/humanoid/hand-22dof-render-1.png" style={{width: '614px', maxWidth: '100%', minWidth: '280px', alignSelf: 'flex-start', height: 'auto'}} />
  <img alt="22 DOF hand render, close-up of fingers and forearm actuators" src="/humanoid-docs/img/humanoid/hand-22dof-render-2.png" style={{width: '607px', maxWidth: '100%', minWidth: '280px', alignSelf: 'flex-start', height: 'auto'}} />
</div>

## Humanoid Leg

<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
  <img alt="Humanoid leg render, light background" src="/humanoid-docs/img/humanoid/leg-render-light.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="Humanoid leg render, dark background" src="/humanoid-docs/img/humanoid/leg-render-dark.png" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="Assembled humanoid leg prototype" src="/humanoid-docs/img/humanoid/leg-prototype-1.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="Assembled humanoid leg prototype with soccer ball" src="/humanoid-docs/img/humanoid/leg-prototype-ball.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
</div>

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
