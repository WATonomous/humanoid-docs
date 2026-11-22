---
id: pioneer-1
title: Pioneer-1 Manipulation
description: Pioneer-1, a flow-matching diffusion transformer that picks the object named in the prompt and puts it in the bowl, with and without async RTC.
sidebar_position: 2.7
---

# Pioneer-1 Manipulation

A flow-matching diffusion transformer, built on the Pioneer-1 architecture. Camera images go through a DINOv2 encoder, and the action tokens cross-attend to those camera tokens. A text prompt steers what it does: "put the green lion in the red bowl", "put the fire truck in the red bowl", and so on. The clips are successes on layouts it never saw in training.

## Without RTC

![](/img/humanoid/videos/ditx-prompted-pick-place.mp4)

## With Async RTC

![](/img/humanoid/videos/ditx-prompted-pick-place-async-rtc.mp4)

With async RTC (real-time chunking), the motion is clearly smoother.

The architecture still needs adjusting, and the model needs more training.
