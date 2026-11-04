---
id: geometric-fabrics
title: Geometric Fabrics PCA
description: Geometric fabrics with a PCA hand synergy space.
sidebar_position: 5
---

# Geometric Fabrics PCA

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/4661eef0-f966-4c65-83d6-3216d7fb3177" type="video/mp4" />
</video>

## Goal

Control a 21-DOF humanoid arm+hand using **geometric fabrics** — a control framework that's fast and stable without needing to solve an optimization problem every step.

The fingers have 15 joints, too many to command directly. So we use **PCA** to compress them to 7 numbers. PCA is trained on real human hand poses and learns the 7 directions that capture most of the variation in finger motion. You give it a 7-number command and it maps back to 15 joint angles via `q_hand = W @ z + μ` — just a change of coordinates. `z` is your 7D input, `W` maps it to joint space, and `μ` is the mean pose so that `z = 0` gives you a natural resting hand.

## Files

| File | Purpose |
|------|---------|
| `compute_pca.py` | Trains PCA from the HUST hand motion dataset, saves matrix/mean/bounds |
| `humanoid_hand_pose_fabric.py` | Core controller — builds all the fabric layers (arm, hand, collision, joint limits) |
| `run_example.py` | Runs the simulation loop at 60 Hz, renders optionally |
| `humanoid_hand_params.yaml` | All the tunable params — gains, collision spheres, joint limits |
| `pca_matrix.npy`, `pca_mean.npy`, `pca_score_*.npy` | Trained PCA files loaded at runtime |
| `FABRICS/` | NVIDIA geometric fabrics framework (submodule) |

## How It Works

Every step, four layers each compute forces and sum them together:

1. **Arm attractor** — holds the arm at a fixed default config (arm doesn't move)
2. **Finger attractor** — takes the 7D PCA command, maps to 15 finger joints, pulls toward them
3. **Body repulsion** — 21 spheres on the robot links push away from obstacles
4. **Joint limit repulsion** — pushes back when joints get near their limits

All of that sums into `qdd = -M⁻¹ f`, which gets integrated to get the next joint state.
