---
id: tendon-hand
title: Tendon Hand
description: The Pioneer tendon hand's finger cables, the spread spring, and the hand under compliant control in simulation.
---

# Tendon Hand

Each finger of the Pioneer hand is driven by **four motors in the forearm, one cable each**. The cables are named by their job,
**f1–f4**, the same on every finger. **f1 is the spread cable**: it pulls the finger's spread yoke toward the thumb, and a spring
pulls it back. A closed cross-cable between the PIP and DIP knuckles makes the last two joints bend together.

<img alt="One finger's cables: four motor cables, the spread spring and the PIP-DIP cross-cable, in side view and seen from the palm" src="/humanoid-docs/img/humanoid/tendon-hand/finger-cables.svg" style={{width: '100%', maxWidth: '1000px', display: 'block', margin: '16px 0'}} />

*Top: one finger from the side, palm side down. Bottom: the spread drive seen from the palm, beside the alternative that was
considered and not chosen (a differential pair, whose spread weakens as the finger curls). Not to scale.*

| Part | Runs | Ends on | Job |
| --- | --- | --- | --- |
| **f1** | palm side, thumb edge | spread yoke, one arm | turns the spread toward the thumb, against the spring |
| **spring** | pocket in the palm plate | spread yoke, other arm | pulls the spread back (18 N preload, 1.5 N/mm) |
| **f2** | palm side, beside f3, over the MCP | proximal link | flexes the MCP |
| **f3** | palm side, centre, over MCP, PIP, DIP | fingertip | curls the PIP and DIP |
| **f4** | back, over MCP, PIP, DIP | fingertip | straightens the PIP, DIP and MCP |
| **cross-cable** | closed loop, PIP knuckle to DIP knuckle | no motor | holds DIP = PIP |

Per finger: 4 motor cables, the cross-cable loop and the spread spring. On the CAD the cables are named per finger (T1–T4 middle,
I1–I4 index, R1–R4 ring, L1–L4 little).

<img alt="The whole hand from the palm side, cables visible at the knuckles" src="/humanoid-docs/img/humanoid/tendon-hand/hand-palm.png" style={{width: '100%', maxWidth: '900px', display: 'block', margin: '16px 0'}} />

*The hand from the palm side: skin, skeleton and the dark palm casing, with each cable in its own colour where it passes the
knuckles. The forearm motors and the wrist are off the top of the picture; the thumb's root joints have their own motors.*

## Videos

These are from a MuJoCo simulation of the whole hand (all four fingers and the thumb, 20 cables), built from the CAD's own geometry.
Each finger runs a **joint impedance controller** from its motor encoders alone: it steers toward a target angle but behaves like a
spring, so it pushes on what it touches with a force you choose and gives way when pushed.

### A push from behind

<video controls muted playsInline preload="metadata" poster="/humanoid-docs/img/humanoid/tendon-hand/push-from-behind.png" style={{display: 'block', width: '100%', maxWidth: '900px', margin: '12px 0'}}>
  <source src="/humanoid-docs/img/humanoid/tendon-hand/push-from-behind.mp4" type="video/mp4" />
</video>

A probe pushes the index finger from the back, then a rod presses all four fingers. **Left:** the joint impedance with its torque caps
and 50 N cable tension budget; the fingers give way and spring back. **Right:** stiff spool position servos, as on a conventional tendon
hand; they fight the probe. The labels show the probe's force and the cable tensions. *Why it matters:* a hand that gets bumped should
yield, not push back hard.

### Power grasp

<video controls muted playsInline preload="metadata" poster="/humanoid-docs/img/humanoid/tendon-hand/power-grasp.png" style={{display: 'block', width: '100%', maxWidth: '900px', margin: '12px 0'}}>
  <source src="/humanoid-docs/img/humanoid/tendon-hand/power-grasp.mp4" type="video/mp4" />
</video>

The fingers close softly on a 36 mm, 100 g bar and each stops at its own contact; the support drops away, the wrist swings, a 5 N
pull tugs the bar, then the hand lets go. *Why it matters:* one "close" command holds the object without a force sensor or a planned
pose per finger.

### Pinch

<video controls muted playsInline preload="metadata" poster="/humanoid-docs/img/humanoid/tendon-hand/pinch.png" style={{display: 'block', width: '100%', maxWidth: '900px', margin: '12px 0'}}>
  <source src="/humanoid-docs/img/humanoid/tendon-hand/pinch.mp4" type="video/mp4" />
</video>

Thumb and index in pinch mode (three times their normal stiffness) hold a 16 mm, 50 g cube; the stand drops away, then the wrist
tilts ±30° and 20° sideways. The plot in the corner draws the pad force (blue) and the cube's slip against the index tip (orange) as it
happens. *Why it matters:* precise grasps of small objects are where tendon hands usually struggle.

### Tracing

<video controls muted playsInline preload="metadata" poster="/humanoid-docs/img/humanoid/tendon-hand/tracing.png" style={{display: 'block', width: '100%', maxWidth: '900px', margin: '12px 0'}}>
  <source src="/humanoid-docs/img/humanoid/tendon-hand/tracing.mp4" type="video/mp4" />
</video>

The index fingertip follows a 12 mm circle. Each point of the circle is turned into MCP and PIP targets by inverse kinematics (DIP =
PIP, spread 0); the controller then tracks those joint targets from the motor encoders alone, with no fingertip feedback. The trail is
where it went: 1.1 mm RMS in the hand's frame. *Why it matters:* it shows the fingertip can be placed to about a millimetre without
joint sensors.

### Gestures

<video controls muted playsInline preload="metadata" poster="/humanoid-docs/img/humanoid/tendon-hand/gestures.png" style={{display: 'block', width: '100%', maxWidth: '900px', margin: '12px 0'}}>
  <source src="/humanoid-docs/img/humanoid/tendon-hand/gestures.mp4" type="video/mp4" />
</video>

The hand moving through poses under the same controller: fist, counting one to five, rock, a pinch with the index and with the little
finger, hook and grip.

*All of this is simulation; the hand has not yet been run on hardware.*
