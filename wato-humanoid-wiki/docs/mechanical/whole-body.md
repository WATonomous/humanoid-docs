---
id: whole-body
title: Whole-Body Humanoid
description: The finalized Pioneer whole-body design, its 67 joints and the leg joint limits.
---

# Whole-Body Humanoid

The finalized Pioneer whole-body design: a white helmet with a graphite visor frame on a white torso, the 5 DOF arms, the 22 DOF tendon
hands and the 6 DOF legs. Left and right are mirror images, part for part.

<div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
  <img alt="Pioneer whole body, three-quarter view" src="/humanoid-docs/img/humanoid/pioneer-whole-body-34.png" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
  <img alt="Pioneer whole body, side view" src="/humanoid-docs/img/humanoid/pioneer-whole-body-side.png" style={{width: 'calc(50% - 6px)', minWidth: '280px'}} />
</div>

### Head

The helmet has a raked wedge visor in gloss black, recessed in a dark graphite frame with a
light bar round it, a fanned rib over the crown, cheek pads and temple vents. The neck dam flares into the torso's collar.

<img alt="Pioneer head, three-quarter view" src="/humanoid-docs/img/humanoid/pioneer-head-34.png" style={{width: '60%', minWidth: '280px', display: 'block', margin: '16px 0'}} />

## 67 Joints

| Group | Joints | Count |
| --- | --- | --- |
| Waist | yaw | 1 |
| Arms | shoulder pitch, shoulder roll, upper arm yaw, elbow, forearm roll | 5 × 2 = 10 |
| Hands | wrist flexion and deviation (2); index, middle, ring and little fingers: spread, MCP, PIP, DIP (4 × 4 = 16); thumb: CMC × 2, MCP, IP (4) | 22 × 2 = 44 |
| Legs | Hip_F, Hip_A, Hip_R, Knee, Ankle_P, Ankle_R | 6 × 2 = 12 |
| **Total** | | **67** |

Each finger's DIP is coupled to its PIP by a cross-cable, so each hand has 18 actuated joints of its 22 (see
[Tendon Hand](./tendon-hand.md)).

## Leg Joint Limits

The same on both legs. The left and right axes mirror each other, so a positive angle moves either leg the same way:
a positive Hip_A spreads the leg outward, a positive Ankle_P points the toes down.

| Joint | DOF | Range (deg) |
| --- | --- | --- |
| Hip_F | Hip pitch | −20 to +90 |
| Hip_A | Hip roll | −10 to +60 |
| Hip_R | Hip yaw | −30 to +90 |
| Knee | Knee pitch | −65 to 0 |
| Ankle_P | Ankle pitch | −30 to +50 |
| Ankle_R | Ankle roll | −15 to +15 |
