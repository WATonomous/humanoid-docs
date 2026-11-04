---
id: vr-teleoperation
title: VR Teleoperation
description: Teleoperating the arms with a Quest VR headset.
sidebar_position: 2
---

# VR Teleoperation

<video width="300" controls muted>
  <source src="/humanoid-docs/img/humanoid/videos/quest-vr-teleop.mp4" type="video/mp4" />
</video>

Meta Quest hand and wrist tracking drives both arms of the bimanual rig in real time — a browser-side WebXR page streams hand poses over a secure WebSocket to a C++ ROS 2 bridge, which feeds a per-arm damped-least-squares IK controller in Isaac Sim, with a stereo POV feed rendered back to the headset so the operator sees through the robot's own cameras. The coolest part: it isn't sim-only. A gated flag streams the left arm's live IK solution straight to the physical robot over CAN, so the same pinch-to-grip, wrist-tracked teleop that drives the simulated arm can drive the real hardware in lockstep — headset in, robot arm moving, all over a USB tunnel with no Wi-Fi setup required.

## Controls

| Action | Effect |
| --- | --- |
| Move right / left wrist | Corresponding arm follows |
| Pinch thumb + index (either hand) | Corresponding gripper closes / opens |
| `R` (Isaac Sim window focused) | Recalibrate — re-home both arms to current wrist pose |
| `--gain VALUE` (default `1.0`) | Scales arm motion per metre of real wrist motion |
