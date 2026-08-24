---
id: index
title: Interfacing
description: Motor control interfacing via CAN bus for the WATonomous Humanoid robot.
---

# Interfacing

This page documents the communication interface between the high-level control software and the motor controllers. The system uses CAN bus as the primary communication protocol, bridging ROS2 nodes running on a laptop with embedded motor controllers (STM32-based FOC drivers and commercial actuators).

## Architecture Overview

The interfacing layer consists of three main components:

```text
┌─────────────────────────────────────────────────────────────┐
│                    ROS2 Control Layer                        │
│  (joint_command, trajectory planning, IK/FK)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ ROS2 topics (MotorCmd, MotorFeedback)
┌─────────────────────▼───────────────────────────────────────┐
│                   CAN Node (ROS2)                            │
│  • Message encoding/decoding (DBC)                           │
│  • SocketCAN / SLCAN interface                               │
│  • Topic-to-CAN mapping                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ CAN bus (physical layer)
┌─────────────────────▼───────────────────────────────────────┐
│              Motor Controllers                               │
│  • STM32 FDCAN (custom FOC controllers)                      │
│  • Commercial motors (AK80-9, AK10-9, GL40 II)               │
└─────────────────────────────────────────────────────────────┘
```

:::note
This interface layer bridges the high-level motion planning (ROS2) with low-level motor control, providing real-time command and feedback over CAN bus.
:::

## CAN Bus Protocol

### Bus Configuration

| Parameter | Value |
| --- | --- |
| Bus type | CAN 2.0 (Classic CAN) |
| Bitrate | 500 kbps (configurable: 10k - 1M) |
| Frame format | Standard (11-bit ID) or Extended (29-bit ID) |
| Max payload | 8 bytes per frame |
| Termination | 120 Ω resistors at both ends |

:::warning
Always ensure proper CAN bus termination with 120 Ω resistors at both ends to prevent signal reflections and communication errors.
:::

### Hardware Interface Options

The system supports two types of CAN interfaces:

1. **SocketCAN** (native Linux CAN)
   - Direct CAN interface (e.g., `can0`, `can1`)
   - Lowest latency
   - Requires hardware CAN adapter

2. **SLCAN** (Serial Line CAN)
   - CAN-over-USB adapter (e.g., CANable via `/dev/ttyACM0`)
   - Automatically configured via setup script
   - Bitrate mapping to SLCAN codes (see `can_core.cpp:262-286`)

### Message Structure

CAN messages follow the standard CAN 2.0 frame format:

```cpp
struct CanMessage {
  uint32_t id;                  // CAN message ID (11 or 29 bits)
  std::vector<uint8_t> data;    // Payload (max 8 bytes)
  uint8_t dlc;                  // Data Length Code
  bool is_extended_id;          // Extended frame format flag
  bool is_remote_frame;         // Remote transmission request
  uint64_t timestamp_us;        // Timestamp in microseconds
}
```

Reference: `humanoid/autonomy/interfacing/can/include/can_core.hpp:8-19`

### DBC-Based Message Encoding

The CAN node uses **DBC (Database CAN)** files to define message formats and signal mappings. This allows for:
- Structured message definition
- Automatic encoding/decoding of physical values
- Signal scaling and offset handling
- Multi-byte signal packing

Reference: `humanoid/autonomy/interfacing/can/include/can_node.hpp:32-36`

## ROS2 CAN Interface

### CAN Core (`CanCore` class)

Low-level CAN interface abstraction that handles:

**Initialization** (`can_core.cpp:21-34`)
- Interface configuration (SocketCAN vs SLCAN)
- Socket creation and binding
- Non-blocking I/O setup

**Transmission** (`can_core.cpp:54-117`)
- CAN frame construction
- Extended ID and RTR flag handling
- Error checking and logging

**Reception** (`can_core.cpp:119-177`)
- Non-blocking frame reception
- ID mask extraction (standard vs extended)
- Timeout handling

**Setup Methods**
- `setupSocketCan()` - Native Linux CAN interface (`can_core.cpp:179-236`)
- `setupSlcan()` - USB CAN adapter via external script (`can_core.cpp:238-308`)

### CAN Node (`CanNode` class)

ROS2 node that bridges ROS topics and CAN messages:

**Key Features:**
- **Topic subscription**: `MotorCmd` messages from joint controllers
- **Message publishing**: `MotorFeedback` for motor state
- **DBC integration**: Signal encoding/decoding using `dbcppp` library
- **Periodic reception**: Timer-based polling for incoming CAN messages

**Message Flow:**

1. **Command Path** (ROS → CAN):
   ```text
   MotorCmd topic → motorCMDCallback() → encodeSignal() → sendMessage() → CAN bus
   ```

2. **Feedback Path** (CAN → ROS):
   ```text
   CAN bus → receiveMessage() → DBC decode → MotorFeedback topic
   ```

:::tip
Use `ros2 topic echo /motor_feedback` to monitor real-time motor telemetry during development.
:::

Reference: `humanoid/autonomy/interfacing/can/include/can_node.hpp:26-68`

### ROS2 Message Types

**Motor Command** (`MotorCmd`)
- Position, velocity, torque setpoints
- Control mode selection
- Device ID targeting

**Motor Feedback** (`MotorFeedback`)
- Current position, velocity
- Motor current, temperature
- Error flags

Reference: `humanoid/autonomy/interfacing/can/include/can_node.hpp:18-24`

## Embedded (STM32) FDCAN Driver

### STM32G4 FDCAN Peripheral

The custom FOC motor controllers use the STM32G4's FDCAN peripheral for CAN communication.

**Hardware Configuration** (`FDCAN_STM32.cpp:25-58`)

| Parameter | Value |
| --- | --- |
| Instance | FDCAN2 |
| Frame format | Classic CAN |
| Mode | Normal |
| Nominal bitrate | ~1 Mbps (calculated from prescaler/segments) |
| GPIO pins | PB12 (RX), PB13 (TX) |
| Alternate function | AF9 (FDCAN2) |
| Interrupts | FDCAN2_IT0, FDCAN2_IT1 |

**Bus-Off Recovery** (`FDCAN_STM32.cpp:7-23`)
- Automatic detection of bus-off state
- Recovery by clearing INIT bit in CCCR register
- Error status callback handling

### Motor Control Loop Integration

The FDCAN driver is integrated into the FOC control loop:

**Setup Phase** (`foc.cpp:11-16`)
1. Initialize PWM for motor phases
2. Configure angle encoder (MT6835)
3. Initialize current sensing
4. Configure motor driver
5. Set PID parameters and call `motor.initFOC()`
6. Initialize FDCAN and enable RX interrupts

**Loop Phase** (`foc.cpp:25-29`)
1. Call `motor.loopFOC()` and `motor.move()`
2. Check ring buffer for CAN messages
3. Process motor commands
4. Send telemetry data back over CAN

Reference: `humanoid/embedded/STM32/app/src/foc.cpp`

## Hardware Setup

### Physical Connections

All motors connect to a shared CAN bus with the following topology:

```text
[Laptop] --USB-- [CANable] --CAN_H/CAN_L-- [Motor 1] -- [Motor 2] -- ... -- [Motor 7] --[120Ω]
   |                                           |           |                    |
[120Ω termination]                         XT30       XT30                   XT30
```

:::note
Each motor has an XT30 connector for CAN data. Power is supplied separately via XT60 (high-voltage motors) or XT30 (low-voltage motors). See [Electrical Documentation](/electrical) for details.
:::

See [Electrical Documentation](/electrical) for detailed wiring diagrams.

### Interface Configuration

**Example: SocketCAN setup**
```cpp
CanConfig config;
config.interface_name = "can0";
config.bustype = "socketcan";
config.bitrate = 500000;
config.receive_timeout_ms = 100;
```

**Example: SLCAN setup (CANable)**
```cpp
CanConfig config;
config.interface_name = "can0";
config.device_path = "/dev/ttyACM0";
config.bustype = "slcan";
config.bitrate = 500000;  // Maps to "-s6" for slcand
```

Reference: `humanoid/autonomy/interfacing/can/include/can_core.hpp:21-28`

## Development & Testing

### Launch Files

Start the CAN interface node:
```bash
ros2 launch can can.launch.py
```

Reference: `humanoid/autonomy/interfacing/can/launch/can.launch.py`

### Testing Tools

**Controller test** (`test_controller.cpp`)
- Automated testing of CAN message encoding/decoding
- Validation of DBC signal mapping
- Performance benchmarking

Reference: `humanoid/autonomy/interfacing/can/test/test_controller.cpp`

### Debugging

**Enable verbose logging** in `can_core.cpp`:
- Uncomment lines 62-75 for transmitted message logging
- Use `RCLCPP_DEBUG` level for received messages

**Monitor CAN traffic** (Linux):
```bash
# View raw CAN messages
candump can0

# Send test message
cansend can0 123#DEADBEEF
```

## Bus Protocol Decisions

### CAN-FD: not actually implemented today

Despite a `data_bitrate` field in `CanConfig` (`can_core.hpp`) suggesting CAN-FD support, current bring-up runs **classic CAN only**:

- `setupSlcan()` only maps arbitration-phase bitrates to SLCAN codes (`-s0`…`-s8`); it never configures an FD data-phase bitrate.
- `params.yaml` sets a single `bitrate: 1000000` and nothing else.
- Hardware is a CANable USB adapter over SLCAN, running classic CAN 2.0 @ 1 Mbps.

The `data_bitrate` field is currently dead code. Tracked in [issue #189](https://github.com/WATonomous/humanoid/issues/189): either wire up real FD support (SLCAN FD framing, dual bitrate config, FDCAN peripheral mode) or remove the field so the config doesn't imply capability we don't have.

### What happens under bus saturation (classic CAN today)

CAN arbitration doesn't drop frames on contention — it delays them. Lower CAN ID always wins, so higher-ID motors get bumped and retried, not silently ignored, when there's contention.

The actual drop point in this codebase is `sendMessage()` in `can_core.cpp`: it uses a non-blocking `write()`. Under saturation this hits `EAGAIN`, logs `"Failed to write CAN frame to socket"`, and drops the command with **no retry**.

Symptoms in practice: intermittent stutter (worse on higher-CAN-ID joints), stale feedback, and possible motor watchdog faults if commands stop arriving for too long — not a crash.

Rough headroom for the current 12-motor classic CAN bus @ 1 Mbps: sustained full-arm update rates up to roughly **~120–150 Hz** stay clear of this degraded regime. Typical teleop/control rates (30–60 Hz) are well within margin.

### Why CAN-FD over EtherCAT for this arm

| | EtherCAT | CAN-FD |
| --- | --- | --- |
| Topology | Daisy-chained ring | Multi-drop bus |
| Bandwidth | 100 Mbps | Higher data-phase rate than classic CAN, same wiring |
| Determinism | µs-level | Lower, but adequate at this scale |
| Integration cost | Needs RT master + ESC chip per slave | Simpler transceivers, incremental over existing CAN stack |
| Right-sized for | 20–30+ actuators (full-body) | 5–14 actuators (arm-scale) |

For this repo's bimanual arm (12–14 motors), EtherCAT's determinism and bandwidth are more than the workload needs, at a real integration cost (RT master, per-slave ESC hardware). **CAN-FD is the appropriately-scaled upgrade path** over classic CAN — same bus topology and mostly the same transceivers, just real FD framing instead of the currently-dead `data_bitrate` field. EtherCAT is worth revisiting if the project scales into full-body locomotion with dozens of actuators.

## Future Enhancements

- **CAN-FD support**: Wire up real FD data-phase config end-to-end (see [issue #189](https://github.com/WATonomous/humanoid/issues/189)), or remove the misleading `data_bitrate` field
- **Retry on `EAGAIN`**: Avoid silent command drops under bus saturation in `sendMessage()`
- **Multi-bus architecture**: Separate buses for different limbs
- **Hardware filtering**: Reduce CPU load by filtering messages at hardware level
- **Time-stamping**: Precise synchronization with external sensors

## References

- [Electrical wiring diagram](/electrical)
- [Motor selection](/mechanical)
- SocketCAN documentation: https://www.kernel.org/doc/html/latest/networking/can.html
- DBC format: https://github.com/stefanhoelzl/CANpy
