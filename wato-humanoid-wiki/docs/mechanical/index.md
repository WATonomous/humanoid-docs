---
id: index
title: Mechanical
description: Mechanical design documentation for the WATonomous Humanoid robot.
---

# Mechanical

<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
  <img alt="Arm overview 1" src="https://github.com/user-attachments/assets/5f185bd3-9063-4381-93f9-63f36d4c2768" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="Arm overview 2" src="https://github.com/user-attachments/assets/bcb7271e-5b23-46c4-b23b-07b461134a69" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
</div>

### 6 DOF Arm + 1 DOF Gripper — Motor Selection

For faster progress, we will be temporarily switching to attaching a gripper instead of the 15 DOF hands for the arm.

|  |  | Rated Torque  | Peak Torque  |
| --- | --- | --- | --- |
| Shoulder (1-2) | AK10-9 V3.0 | 18Nm  | 53Nm  |
| Elbow (3-4-5) | AK80-9 V3.0 | 9Nm | 22Nm |
| Wrist (6)  | GL40 II KV70 |  0.25Nm | 0.73Nm  |
| Gripper (7) | GL40 II KV70 |  0.25Nm | 0.73Nm  |

## 22 DOF Hand

22 DOF hand (16 actuated).

<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
  <img alt="22 DOF hand, palm view 2" src="/humanoid-docs/img/humanoid/hand-22dof-3.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="22 DOF hand, dorsal view 2" src="/humanoid-docs/img/humanoid/hand-22dof-4.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="22 DOF hand, palm view" src="/humanoid-docs/img/humanoid/hand-22dof-1.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="22 DOF hand, dorsal view" src="/humanoid-docs/img/humanoid/hand-22dof-2.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="22 DOF hand CAD render, palm view" src="/humanoid-docs/img/humanoid/hand-22dof-5.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="22 DOF hand CAD render, dorsal view" src="/humanoid-docs/img/humanoid/hand-22dof-6.jpg" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
</div>

## Humanoid Leg

<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
  <img alt="Humanoid leg CAD render 1" src="/humanoid-docs/img/humanoid/leg-cad-1.png" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="Humanoid leg CAD render 2" src="/humanoid-docs/img/humanoid/leg-cad-2.png" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="Humanoid leg CAD render 3" src="/humanoid-docs/img/humanoid/leg-cad-3.png" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="Humanoid leg CAD render 4" src="/humanoid-docs/img/humanoid/leg-cad-4.png" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
</div>

### 6 DOF Per Leg — Motor Selection

| Joint | DOF | Motor |
| --- | --- | --- |
| Hip | Pitch | AKH70-48 |
| Hip | Yaw | RS03 |
| Hip | Roll | RS04 |
| Knee | Pitch | AKH70-48 |
| Ankle | Pitch | RS03 |
| Ankle | Roll | RS03 |

### Hip

The hip design uses the **F-A-R** (Flexion-Abduction-Rotation) configuration for a compact and biomimetic joint arrangement. This configuration allows for efficient packaging of the actuators while maintaining the necessary degrees of freedom for humanoid locomotion.
