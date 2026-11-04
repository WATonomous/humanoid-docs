---
id: arm-kinematics
title: Arm Kinematics & IK
description: Bimanual inverse kinematics, the Jacobian IK controller, and the arm DH parameters.
sidebar_position: 1
---

# Arm Kinematics & IK

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


## Arm Kinematics: DH Parameters & Workspace

Derived from the `wato_arm_v2` (armWithStand) URDF — the 6-revolute-joint arm chain plus its 2-DOF parallel gripper (right arm shown; left is a mirror image).

### Denavit-Hartenberg parameters

Every consecutive joint-axis pair in this design intersects exactly (common-normal length $a_i = 0$ for all six joints) with a $90°$ twist between axes 1–6, so the chain reduces to pure link offsets $d_i$ along each joint's own axis, with $\theta_i$ the joint variable:

| Joint | $a_i$ (mm) | $\alpha_i$ (deg) | $d_i$ (mm) | $\theta_i$ | Axis (local) |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | — | −279.3 | $\theta_1$ | Y |
| 2 | 0 | 90 | −7.0 | $\theta_2$ | X |
| 3 | 0 | 90 | 300.9 | $\theta_3$ | −Z |
| 4 | 0 | 90 | 2.3 | $\theta_4$ | −Y |
| 5 | 0 | 90 | −235.5 | $\theta_5$ | Z |
| 6 | 0 | 90 | 7.0 | $\theta_6$ | −Y |

$d_3$ (upper arm) and $d_5$ (forearm) dominate reach; $d_2$, $d_4$, $d_6$ are small wrist/shoulder eccentricities from the CAD design. The gripper (`joint7`/`joint8`, prismatic along the wrist's Y) rides on link 6 as the end effector and isn't part of the DH chain above.

Joint limits are not yet defined in the exported URDF (placeholder `0..0` on every joint) — the numbers below ignore joint limits and self-collision.

### Workspace

Forward kinematics through the chain above, sampled and refined (Nelder-Mead) over the full joint range:

| Quantity | Value |
| --- | --- |
| Max reach (fully outstretched) | ≈ 934 mm from `base_link` |
| Min reach (fully folded) | ≈ 0 mm (arm can fold onto itself — no limits enforced yet) |
| Reach at zero configuration | 698 mm |

Because real joint limits aren't set yet, this is the theoretical actuation envelope, not the usable collision-free workspace — narrowing it down requires the actual limits plus a self-collision check once those are added to the URDF.
