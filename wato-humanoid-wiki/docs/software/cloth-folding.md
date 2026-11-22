---
id: cloth-folding
title: Cloth Folding
description: One Pioneer-1 policy that folds both pants and t-shirts in simulation, picking the task from the prompt.
sidebar_position: 2.8
---

# Cloth Folding

:::gallery 1
![](/img/humanoid/videos/cloth-fold-pants.mp4)
![](/img/humanoid/videos/cloth-fold-tshirt.mp4)
:::

A single policy, trained with the Pioneer-1 architecture from the humanoid repo, folds more than one type of clothing in simulation. The prompt tells it which garment it is folding, so the same model does both tasks.

| Garment | Demos | Result |
| --- | --- | --- |
| Pants | 105 | ~60% success |
| T-shirt | 26 | Not consistent yet, but the folding motion is already there |

Even with only 26 t-shirt demos, the policy picks up the rough folding behaviour. More t-shirt demos are next.

Pioneer-1 is still changing, so its details aren't written up here yet.
