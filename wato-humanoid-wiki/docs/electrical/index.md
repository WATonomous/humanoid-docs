---
id: index
title: Electrical
description: Power architecture, power distribution and CAN bus wiring for the WATonomous Humanoid.
---

# Electrical

The electrical system of the WATonomous Humanoid, split into:

- **[Power Architecture](./power-architecture)**: the planned full-body system. A 12S7P battery pack feeds a main distribution box, which feeds one PDU per limb. Also covers the battery pack, current budget and the custom PDU board.
- **[Arm Test Setup](./arm-test-setup)**: the current bench setup for the 6 DOF arm, powered from a 51.2 V battery and controlled over CAN from a laptop via a CANable USB adapter.

## CAN Bus

All seven motors share a single CAN network for command and feedback.

### Controller

A **laptop** connects over **USB** to a **CANable** adapter, which drives the bus.

### Wiring

| Line | Function |
| --- | --- |
| CAN_H | CAN high |
| CAN_L | CAN low |

Each motor taps into CAN_H and CAN_L via **XT30** connectors. The bus is **terminated at the end** with a **120 Ω** resistor to prevent signal reflections.

## Boards

Eight custom boards make up the power system. Details for each are coming soon.

| Board | Count |
| --- | --- |
| PDB (power distribution board), one per limb plus one auxiliary | 5 |
| Brake chopper | 1 |
| E-stop and contactor board | 1 |
| BMS balancing-line protection board | 1 |

## Connector Summary

| Connector | Use |
| --- | --- |
| XT60 | 51.2 V power to AK80-9 and AK10-9 motors |
| XT30 | 16 V power to GL40 II motors; CAN data on all motors |
| Anderson SB175 / Surlok Plus 8 mm | Main battery pack leads (power architecture) |

## Wire Gauge Summary

| Application | Gauge |
| --- | --- |
| Main pack leads (power architecture) | 6 AWG silicone |
| Main power (battery to E-stop, E-stop to bus bar) | 6 AWG |
| Distribution (bus bar to motors and buck converter) | 12 AWG |
