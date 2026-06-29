---
title: Mechanical
description: Mechanical design documentation for the WATonomous Humanoid robot.
---

# Mechanical
<img alt="Arm overview 1" src="https://github.com/user-attachments/assets/5f185bd3-9063-4381-93f9-63f36d4c2768" />
<img alt="Arm overview 2" src="https://github.com/user-attachments/assets/bcb7271e-5b23-46c4-b23b-07b461134a69" />
<img alt="Arm overview 3" src="https://github.com/user-attachments/assets/cd06b11b-d9ba-468f-a268-d618e690c815" />

### 6 DOF Arm + 1 DOF Gripper — Motor Selection

For faster progress, we will be temporarily switching to attaching a gripper instead of the 15 DOF hands for the arm.

|  |  | Rated Torque  | Peak Torque  |
| --- | --- | --- | --- |
| Shoulder (1-2) | AK10-9 V3.0 | 18Nm  | 53Nm  |
| Elbow (3-4-5) | AK80-9 V3.0 | 9Nm | 22Nm |
| Wrist (6)  | GL40 KV70 |  0.25Nm | 0.73Nm  |
| Gripper (7) | GL40 KV70 |  0.25Nm | 0.73Nm  |

<img alt="Mechanical diagram" src="https://github.com/user-attachments/assets/98e805ce-85e7-4e60-a6d6-ad80288cb3b3" width="500" />

---

<img alt="Mechanical assembly" src="https://github.com/user-attachments/assets/e6431c96-b21a-4934-94b6-79166dc7ba87" width="600" />

## Humanoid Leg (Work in Progress)

### Hip

<img alt="Humanoid leg hip design" src="../_static/images/leg_hip_design.png" width="600" />

The hip design uses the **F-A-R** (Flexion-Abduction-Rotation) configuration for a compact and biomimetic joint arrangement. This configuration allows for efficient packaging of the actuators while maintaining the necessary degrees of freedom for humanoid locomotion.
