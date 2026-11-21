---
slug: tvc-rocket
title: "How we built a Thrust Vector Control (TVC) Rocket"
authors: [wilson, senna]
tags: [rocketry, tvc]
ascii: rocket
---

A spinoff project from the members of the humanoid team in building a thrust-vector-controlled (TVC) rocket.

![](/img/humanoid/videos/tvc-rocket.mp4)

{/* truncate */}

## What is TVC?

Traditional model rockets used fins to stabalize itself during ascent, acting as a form of passive control. But in actual rockets from NASA or SpaceX, **Thurst Vector Control (TVC)** is often used. TVC is an active closed-loop control that gives great stability, control and works in low atmospheric density with less drag, independent from airflow.

**How TVC works:** servo gimbal motors are attached to the rocket motor, when the rocket tilts, the control loop calculates the angle needed to gimbal the rocket motor, where the horizontal component of the rocket thrust will generate the torque needed to compensate the tilt and stabalize the rocket's orientation

![How TVC works: the control loop gimbals the motor so the thrust's horizontal component torques the rocket upright](/img/humanoid/rocketry/how-tvc-works.svg)

## Pioneer Rocket

The long term goal we had is propulsive landing, to bring the rocket back down under its own thrust like SpaceX, or catch it out of the air like Starship. Both of those are just TVC problems taken further, needing control through a harder flight regime than ascent. So this TVC rocket is the first steps, hence the name 'Pioneer' (also where the humanoid is named after :))

**The biggest challenge:** Every single test will require one solid rocket motors and consume it entirely, there is small room for iterating on design and retest. We also need to try our best to validate everything before taking the risk to do a launch.

## The control algorithm - PID Control

We used PID control in our TVC, in PID, learning P (Proportional gain), I (Integral gain) and D (Derivative gain) would be useful

### The ping-pong ball analogy

I think the easiest way to think about PID is to imagine balancing a ping-pong ball on a racket, trying to keep it centered.

- **P (Proportional)** — as the ball gets further from center, you'd naturally tilt the racket more to bring it back. That's proportional control, you tilt based on how far off-center the ball currently is. The bigger the offset, the bigger the tilt, strictly proportional.

  $$u_P(t) = K_p\, e(t)$$

- **D (Derivative)** — if the goal is to have the ball sitting still at the center, position alone isn't enough. You would also watch how fast it's moving toward the center, and pre-emptively tilt against that motion so it slows down and settles right at the center instead of flying past it. That's what the derivative gain does.

  $$u_D(t) = K_d \frac{de(t)}{dt}$$

- **I (Integral)** — if the ball keeps drifting the same way over time (say your racket's slightly tilted to begin with), integral gain accumulate that error so that small tiny error like this became noticeable and this persistent bias can be corrected.

  $$u_I(t) = K_i \int_0^t e(\tau)\, d\tau$$

All three of these come together and make sure the control loop is done very well. (Worth noting though, not every real controller uses all three terms. A lot of actuator-driven systems run **PD** instead of full PID, one of the reasons being the integral term can cause integrator "windup" issues once the actuator saturates (maxes out), where the buildup causes a big overshoot when it un-saturates. For Pioneer rocket, we still keep the I gains but we used anti-windup to cap how large it gets.

### Applying to the rocket

Under the same principle, instead of position error, the error term in pioneer rocket is just the error between desired and actual pitch/yaw angle:

$$e(t) = \theta_{desired}(t) - \theta_{actual}(t)$$

The PID controller turns that error into a commanded gimbal deflection angle $\delta(t)$:

$$\delta(t) = K_p\, e(t) + K_i \int_0^t e(\tau)\, d\tau + K_d \frac{de(t)}{dt}$$

And that commanded angle turns into actual torque on the rocket:

$$\tau = F_T \sin(\delta) \cdot L$$

where $F_T$ is the thrust force, $\delta$ is the gimbal deflection angle, and $L$ is the distance from the gimbal pivot to the rocket's center of mass. By tuning $K_p$, $K_i$, and $K_d$ right, this gets us a responsive TVC control loop that corrects for disturbances in real time.

## Airframe and avionics

The body's a foil-wrapped tube with a 3D-printed nose cone, while the gimbal mount is at the base, with a printed bracket holding two servos at 90° to each other, one for pitch and one for yaw, so the motor can be pushed off-axis in any direction.

We designed a custom PCB Flight Computer with an BNO085 9DOF IMU for angle data (that's what feeds the PID loop) and a BMP180 barometer. All of it sits in a bay cut into the body tube, wired straight to the servos.

![Pioneer fully assembled with avionics bay open](/img/humanoid/rocketry/pioneer-assembled.jpg "width=400")

## Vigorous step-by-step testing

Every real launch 1) happens in an instant 2) consumes an entire solid rocket motor 3) carries a certain risk, we can't just say launch it and see what happens. Instead we had a vigorous testing pipeline, where stage-by-stage it validates the system and proved the system safer and more reliable :

1. **MATLAB/Simulink simulation** — simulate the flight conditions to verify the control loop and gains actually work against a simulated rocket. We also made use of this simulation to get us the initial gains to start off with for stage 2 testing, so we can start off with values that make sense and fine-tune them.

![Simulink rocket motor control loop model](/img/humanoid/rocketry/simulink-model.png "width=700")

![Simulink simulation results showing PID response](/img/humanoid/rocketry/simulink-results.png "width=700")

2. **BLDC test bench** — before we use an actual rocket motor, we used a BLDC to emulate it , by benchmarking it and reproducing the same thrust as the rocket motor, it gives us the first validation that the gimbal actuator and control loop works. We can push the rocket and the actuators tilt the BLDC and get the rocket maintain upright.

![Gimbal and motor mounted on the bench](/img/humanoid/rocketry/gimbal-bench-1.jpg "width=500")

![Rocket clamped in the BLDC test bench](/img/humanoid/rocketry/gimbal-bench-2.jpg "width=500")

3. **Motor test bench static fire** — full control loop testing using real motor, but static-fired on a stand so we can measure gimbal response right before an actual flight.

![Pioneer static fire ignition](/img/humanoid/rocketry/static-fire.jpg "width=500")

4. **Actual flight test** — Pioneer launches from the launch pad!

![Pioneer on the launch pad before flight](/img/humanoid/rocketry/pioneer-on-pad.jpg "width=500")

![Pioneer liftoff](/img/humanoid/rocketry/pioneer-liftoff.jpg "width=500")

## Results

After all our vigorous testing, we got two consecutive successful launches, proving the reliability of our Pioneer Rocket!
