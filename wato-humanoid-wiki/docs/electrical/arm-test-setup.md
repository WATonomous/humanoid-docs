---
id: arm-test-setup
title: Arm Test Setup
description: "The current bench setup for the 6 DOF arm: a 51.2 V battery, an e-stop, bus bars and CAN from a laptop."
sidebar_position: 2
---

# Arm Test Setup

The 6 DOF arm is currently tested on the bench with a simpler setup: a 51.2 V battery, an e-stop and bus bars, with no PDU. It will move onto the [power architecture](./power-architecture) once the pack and PDUs are built.

![Arm electrical wiring diagram](/img/humanoid/arm-electrical-diagram.png)

## Overview

| Subsystem | Description |
| --- | --- |
| Power source | 51.2 V battery |
| Safety | E-stop on the positive rail |
| High-voltage motors | 3× AK80-9, 2× AK10-9 at 51.2 V |
| Low-voltage motors | 2× GL40 II at 16 V (via buck converter) |
| Communication | Shared CAN bus (CAN_H / CAN_L), terminated with 120 Ω |

## Battery and bus bars

Power flows from the **51.2 V battery** through an **E-stop switch** on the positive side, then to a **Bus Bar (+)**. The battery negative connects directly to **Bus Bar (−)**.

| Connection | Wire gauge |
| --- | --- |
| Battery (+) → E-stop | 6 AWG |
| E-stop → Bus Bar (+) | 6 AWG |
| Bus Bar (+) → loads | 12 AWG |
| Battery (−) → Bus Bar (−) | 6 AWG |

## Motor power

Five motors run directly from the 51.2 V bus bars via **XT60** connectors:

| Motor | Quantity | Voltage | Connector |
| --- | --- | --- | --- |
| AK80-9 | 3 | 51.2 V | XT60 |
| AK10-9 | 2 | 51.2 V | XT60 |

Two **GL40 II** motors operate at a lower voltage. A **buck converter** steps the 51.2 V bus down to **16 V**, which is delivered to both motors via **XT30** connectors.

| Motor | Quantity | Voltage | Connector |
| --- | --- | --- | --- |
| GL40 II | 2 | 16 V | XT30 |

These motors correspond to the [6 DOF arm motor selection](/mechanical): AK10-9 at the shoulder, AK80-9 at the elbow joints, and GL40 at the wrist and gripper.
