---
id: power-architecture
title: Power Architecture
description: "The planned full-body power system for Pioneer: the 12S7P battery pack, current budget, distribution box, voltage thresholds and the per-limb PDU."
sidebar_position: 1
---

# Power Architecture

The full humanoid runs from a single **12S7P lithium-ion battery pack**. Its voltage is set by the CubeMars motor drivers, which accept **18 to 52 V**. A 13S pack would reach 54.6 V at full charge, so the pack is 12S.

```mermaid
flowchart TB
  subgraph PACK["Battery pack"]
    direction LR
    CELLS["12S7P cells<br/>EVE INR21700/40PL"] --- BMS["BMS<br/>JK BMS"]
    CELLS --> FUSE["Main fuse<br/>300 A Class T"]
  end
  subgraph MDB["Main distribution box"]
    direction LR
    CHG["Charge port<br/>20 A fuse"]
    COIL["Coil supply<br/>48 V → 12 V"] --> ESTOP["E-stop (NC)"]
    ESTOP -.->|coil| CONT["Contactor<br/>250 A DC"]
  end
  FUSE --> CONT
  FUSE --> CHG
  CONT --> BUS(["Main bus, 43–49 V"])
  BUS --- CAPS["Bus caps"]
  BUS --- CHOP["Brake chopper<br/>on at 49.8 V"] --> RES["2 Ω braking<br/>resistor"]
  BUS --> AL["PDU<br/>Arm L"]
  BUS --> AR["PDU<br/>Arm R"]
  BUS --> LL["PDU<br/>Leg L"]
  BUS --> LR["PDU<br/>Leg R"]
  BUS --> MISC["PDU – Misc<br/>(optional)"]
```

## Battery pack

The custom pack is built from 84 EVE 21700 Li-ion cells, seated in cell holders in two blocks of 42.

:::gallery 16fr 9fr
![84 21700 cells in holders, side view](/img/humanoid/battery-pack-cells-side.jpg)
![84 21700 cells in holders, top view](/img/humanoid/battery-pack-cells-top.jpg)
:::

| Parameter | Value |
| --- | --- |
| Cells | EVE INR21700/40PL (84 in pack, 7 spare) |
| Configuration | 12S7P |
| Nominal voltage | 43.2 V (12 × 3.60 V) |
| Charge ceiling | 49.0 V (4.08 V/cell), set on the charger CV setpoint |
| Practical low-voltage cutoff | 36.0 V (3.00 V/cell) |
| Capacity | 28.0 Ah |
| Energy | 1210 Wh total, ~1006 Wh usable |
| Estimated runtime | ~25 min at 2284 W |
| Estimated mass | 8 to 9 kg with holders, interconnects, BMS and case |
| Cell interconnect | EMS SIGMACLAD 60, 0.20 mm, with a fuse neck at every cell |

The pack averages about 41 V in service, below the motors' 48 V rating. Torque is current-limited and unaffected, but top-end speed headroom drops by roughly 10%.

## Current budget

| Condition | Pack current | Per cell |
| --- | --- | --- |
| Average continuous (walking, moving slowly) | ~53 A | ~7.6 A |
| Coincident peak (fast motion, 30% of actuators at max current at once) | ~249 A | ~35.6 A |
| Pack cell-limited ceiling | 490 A | 70 A |
| Theoretical all-actuator peak | ~831 A | ~119 A, **exceeds the cell rating** |

The 30% simultaneity figure is an assumption about the controller, not a property of the battery. The motion controller must enforce a pack-level current budget, derating torque as aggregate current approaches the limit. The BMS must not be the thing that catches it: a BMS trip mid-motion drops the robot.

Total pack resistance is estimated at ~36 mΩ, so a 249 A peak sags the bus by ~9 V. Undervoltage detection must use a filtered average, and available power should be derated as state of charge falls.

## Main distribution box

| Component | Role |
| --- | --- |
| Main fuse, 300 A Class T | Pack-level fault protection. Sits above the 249 A peak, so it clears real faults without tripping on normal peaks |
| BMS, JK BMS | Cell monitoring, balancing, and overvoltage and overcurrent protection. It protects the battery only, not the motors or boards |
| Contactor, 250 A DC | Main power switch. Its coil runs from a 48 V → 12 V supply through the e-stop |
| E-stop (normally closed) | Breaks the contactor coil circuit, which opens the contactor |
| Precharge resistor | Charges the bus capacitance before the contactor closes, so contacts and connectors are not welded by inrush |
| Bus capacitors | Bulk capacitance on the main bus |
| Brake chopper + 2 Ω resistor | Dumps regenerated energy into a 2 Ω / 400 W resistor when the bus reaches 49.8 V |
| Charge port, 20 A fuse | Separately fused charging input |
| Manual service disconnect | Lets a person break the series chain before working on the pack |

## Voltage thresholds

All the overvoltage thresholds sit between the charge ceiling and the 52 V driver limit:

| Threshold | Voltage | Set by |
| --- | --- | --- |
| Driver absolute maximum | 52.0 V | CubeMars |
| PDU hot-swap overvoltage | 51.0 V | Each PDU |
| BMS cell overvoltage (worst case) | 50.4 V | BMS (4.25 V/cell, −0.05 V tolerance) |
| Brake chopper on | 49.8 V | Main-bus chopper |
| Charge ceiling | 49.0 V | Charger CV setpoint |
| BMS cell undervoltage | 33.8 V | BMS (12 × 2.82 V) |

The brake chopper must fire before the BMS overvoltage trip, and the BMS trips on the **highest single cell**. Pack balance is therefore part of regen protection. Under worst-case braking the bus is expected to peak at 50.3 to 50.8 V, leaving only **1.2 to 1.7 V** of margin to the driver limit. This is the tightest margin in the design and must be verified on a scope.

## Wiring and connectors

| Item | Spec |
| --- | --- |
| Main pack leads | 6 AWG silicone, high strand count |
| Main pack connectors | Anderson SB175 or Amphenol Surlok Plus 8 mm. XT90 and XT150 are **not** rated for the 249 A peak |

## Power Distribution Unit (PDU)

A custom **PDU** (also called PDB, power distribution board) is being designed for each limb. Each one takes the 43–49 V main bus and adds input protection, switched and protected outputs, and a microcontroller that reports over CAN.

### Planned PDU layout

For now, the full humanoid is planned to use **four PDUs** on the main bus, one per limb, plus an **optional auxiliary power board**:

| Board | Count | Powers |
| --- | --- | --- |
| Arm PDU | 2 | One per arm (left and right) |
| Leg PDU | 2 | One per leg (left and right) |
| Auxiliary power board (optional) | 1 | Extra loads such as the RealSense camera, the Jetson, and possible future waist yaw actuators |

The block diagram below shows the arm PDU. Its "48 V" labels refer to the main bus, which runs from 43 to 49 V in practice.

![PDU block diagram for one arm](/img/humanoid/arm-pdu-block-diagram.png)

### Input protection

The battery input (**Vin – BMS (+)** and **Vin – BMS (−)**) passes through three protection stages before reaching any load:

| Stage | Purpose |
| --- | --- |
| TVS diode | Clamps voltage transients and spikes on the input |
| Overcurrent / short circuit protection | Cuts power on excessive current draw or a short |
| Overvoltage / undervoltage protection | Disconnects the rails when the input leaves the safe voltage window. The hot-swap overvoltage trip is 51.0 V |

### Logic power and control

| Block | Function |
| --- | --- |
| 48 V → 5 V buck | Steps the protected input down to 5 V first; going straight to 3.3 V would be less stable |
| 5 V → 3.3 V LDO | Provides a clean 3.3 V rail for the logic |
| Microcontroller, STM32G474 | Monitors the board and commands the 48 V load switches and the 24 V e-fuses |
| CAN interface | Connects the microcontroller to the arm CAN bus |
| Load switch controller | Driven by the microcontroller over I²C; drives the EN pins of both load switches |

### Outputs

| Output | Path | Loads |
| --- | --- | --- |
| 48 V (+ / −) | LM5069 hot-swap load switch, 3 parallel MOSFETs → output | AK80-9 and AK10-9 motors |
| 24 V (+ / −) | EMI filter → 48 V to 24 V buck (LM5145, 2 external MOSFETs) → e-fuse → output | AK45-10 wrist and gripper motors |

- The **LM5069 load switches** let the microcontroller turn the 48 V rail on slowly (limiting inrush), off when unused, or off for safety. Three MOSFETs in parallel spread the heat.
- The **EMI filter** ahead of the 24 V buck keeps switching noise off the main 48 V rail.
- The **e-fuse** on the 24 V rail provides fast overcurrent protection for the low-voltage motors.
- The **LM5145** buck controller drives external MOSFETs, which handle the switching and conduction losses better than an integrated switch.
