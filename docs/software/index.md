---
title: Software & ML
description: Software and machine learning documentation for the WATonomous Humanoid.
---

# Software & Machine Learning


## 6 DOF Arm + 15 DOF Hand Jacobian Iterative Based IK Controller

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/02b19410-c39e-403a-9bea-164c5141f61f" type="video/mp4">
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


## Reinforcement Learning

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/1d998015-7e5d-4d95-a16e-5a038e604794" type="video/mp4">
</video>

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/80bf81cc-a531-469d-bf8f-33957ce153b9" type="video/mp4">
</video>

## Geometric Fabrics PCA

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/4661eef0-f966-4c65-83d6-3216d7fb3177" type="video/mp4">
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
