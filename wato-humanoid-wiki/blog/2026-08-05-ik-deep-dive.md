---
slug: ik-deep-dive
title: "Inverse Kinematics: Arm & Hand"
authors: [wilson]
tags: [software, ik]
---

How do you tell a robot arm "put your hand right here," or a robot hand "put your fingertip right here," and have it actually figure out the joint angles to make that happen? That's inverse kinematics, and it's what drives both the bimanual arm setup and the individual hand.

<video width="600" controls>
  <source src="/humanoid-docs/img/humanoid/videos/ik-bimanual-arm.mp4" type="video/mp4" />
</video>

{/* truncate */}

## Forward vs. inverse

Forward kinematics is the easy direction: given a set of joint angles, figure out where the end effector ends up. Just chain the transforms down the chain — this joint rotates this much, that joint rotates that much, tip lands here. Mechanical, no ambiguity, one answer.

Inverse kinematics is the direction we actually want, and it's the hard one: given a target position, figure out what joint angles get you there. With enough joints, there's no clean formula for this — you can't just "solve for q." So instead of solving it directly, we solve it iteratively: start from wherever the arm or hand currently is, and nudge the joints a little bit at a time until it gets close enough to the target.

Both of the IK systems on the robot — the bimanual arm and the hand — work this way. Same core technique, damped least squares (DLS), used in two different setups depending on what's being targeted.

## Two arms, two independent chains

For the bimanual arm setup (video above), a cube in the scene is the target — move the cube, and the arm's 6 joints follow to keep the gripper tip on it. This one runs on Isaac Lab's built-in `DifferentialIKController` with `ik_method="dls"`, so we get damped least squares for free without writing our own solver.

That works cleanly here because each arm only ever has one target: its own gripper tip. And since the left arm's 6 joints and the right arm's 6 joints don't overlap — two fully independent kinematic chains off the torso — there's zero coupling between them. Each arm gets its own controller instance, chasing its own target, completely unaware the other arm exists.

## Five fingertips, one shared chain

<video width="600" controls>
  <source src="https://github.com/user-attachments/assets/02b19410-c39e-403a-9bea-164c5141f61f" type="video/mp4" />
</video>

The hand can't get away with the same trick. It's a 6 DOF arm plus a 15 DOF hand — 21 degrees of freedom total — driving 5 fingertips at once, and all 5 of those fingertips share the same upstream arm joints. A target for one fingertip and a target for another aren't independent: moving the arm to help one finger reach its target shifts where every other finger ends up too.

A single-target controller like `DifferentialIKController` has no way to solve that — it only ever sees one Jacobian block for one body. So instead, `fingertip_ik.py` is a hand-rolled solver that stacks all 5 fingertip Jacobians into one system and solves for all 21 joints jointly, so the shared arm joints get moved in a way that's good for all 5 targets at once, not just whichever one happened to go first.

### Why damped least squares

With 21 joints and only 15 position constraints (5 fingertips × 3D each), the naive approach — just invert the Jacobian and solve directly — runs into trouble near certain poses: the Jacobian gets close to singular, and a plain inverse tries to divide by something close to zero. That means huge, unstable joint jumps right when the hand is near a tricky configuration.

Damped least squares fixes this by adding a small penalty on how big the joint step is allowed to be, instead of solving the system exactly. That penalty (the damping term) keeps the solution well-behaved even when the Jacobian is near-singular, at the cost of moving a bit more cautiously.

### The loop

Each iteration does basically the same four things:

1. **Where are we now?** Run forward kinematics to get the current fingertip positions.
2. **How far off are we?** For every fingertip with a target, compute the error vector — target position minus current position — and stack all of them into one big error vector $\mathbf{e}$.
3. **Which way do we move?** Build the Jacobian $\mathbf{J}$ — it maps small joint changes to small fingertip movements — and solve the damped least squares problem for the joint step $\Delta\mathbf{q}$:

$$
\bigl(\mathbf{J}^{\mathsf T}\mathbf{J} + \lambda \mathbf{I}\bigr)\,\Delta\mathbf{q} = \mathbf{J}^{\mathsf T}\mathbf{e}
$$

4. **Take the step.** Apply a fraction of that joint step ($\mathbf{q} \leftarrow \mathbf{q} + \alpha\,\Delta\mathbf{q}$), clip to joint limits, and repeat.

That loop runs until the error drops below a tolerance or it hits a max iteration count — at which point you've got a joint configuration that puts every fingertip where it needs to be, or as close as the hand's geometry allows. The Jacobians and forward kinematics come from MuJoCo, with Isaac Sim handling visualization. Only fingertip position is constrained — orientation is left free — which keeps the problem smaller and the solver faster per iteration.

For the exact algorithm, defaults, and code-level detail, see the [Software & ML docs](/humanoid-docs/software).
