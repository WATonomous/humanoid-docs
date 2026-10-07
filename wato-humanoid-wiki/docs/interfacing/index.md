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

Bring-up steps (calibrate, visualize, move) live in the repo: [`src/interfacing/README.md`](https://github.com/WATonomous/pioneer_humanoid/blob/main/src/interfacing/README.md).

### Bus Configuration

| Parameter | Value |
| --- | --- |
| Bus type | CAN 2.0 (Classic CAN) |
| Bitrate | 1 Mbps (`bitrate` in `src/interfacing/can/config/params.yaml`) |
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
   - CAN-over-USB adapter: the CANable, as `/dev/canable` (udev symlink from `can_udev.sh install`)
   - `can.launch.py` starts `slcand` and brings up `can0`
   - Bitrate maps to an SLCAN code (1 Mbps → `-s8`) in `can_core.cpp`

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

Reference: `src/interfacing/can/include/can_core.hpp`

### DBC-Based Message Encoding

The CAN node uses **DBC (Database CAN)** files to define message formats and signal mappings. This allows for:
- Structured message definition
- Automatic encoding/decoding of physical values
- Signal scaling and offset handling
- Multi-byte signal packing

Reference: `src/interfacing/can/include/can_node.hpp`

### MIT Control (arm motors)

The arm's CubeMars motors run in MIT mode (position + velocity + kp/kd + feed-forward torque in one frame). `can_node` packs and decodes these itself (`src/interfacing/can/src/mit_protocol.cpp`), not through the DBC. Each motor's dialect is set in `src/interfacing/can/config/mit_profiles.yaml`:

| Family | Motors | Command frame | Feedback |
| --- | --- | --- | --- |
| `gl2` | GL40 wrist (22), gripper (21) on a GL II drive | Standard frame on the motor id; `MIT_ENTER` first | On the master id (default `0x000`) |
| `ak` | AK10-9, AK80-9 (V3 firmware) | Extended frame `0x800 \| id`, KP-first payload | Servo status frame, decoded via the DBC |

Gains, torque caps and the watchdog live in `joint_command` (`src/interfacing/joint_command/config/arm_actuators.yaml`). Details: [`can/README.md`](https://github.com/WATonomous/pioneer_humanoid/blob/main/src/interfacing/can/README.md#mit-mode).

## ROS2 CAN Interface

### CAN Core (`CanCore` class)

Low-level CAN interface abstraction that handles:

**Initialization** (`can_core.cpp`)
- Interface configuration (SocketCAN vs SLCAN)
- Socket creation and binding
- Non-blocking I/O setup

**Transmission** (`can_core.cpp`)
- CAN frame construction
- Extended ID and RTR flag handling
- Error checking and logging

**Reception** (`can_core.cpp`)
- Non-blocking frame reception
- ID mask extraction (standard vs extended)
- Timeout handling

**Setup Methods**
- `setupSocketCan()` - Native Linux CAN interface (`can_core.cpp`)
- `setupSlcan()` - USB CAN adapter via external script (`can_core.cpp`)

### CAN Node (`CanNode` class)

ROS2 node that bridges ROS topics and CAN messages:

**Key Features:**
- **Topic subscription**: `MotorCmd` on `/interfacing/motorCMD`, from `joint_command`
- **Message publishing**: `MotorFeedback` on `/interfacing/motorFeedback`
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
Use `ros2 topic echo /interfacing/motorFeedback` to monitor real-time motor telemetry during development.
:::

Reference: `src/interfacing/can/include/can_node.hpp`

### ROS2 Message Types

**Motor Command** (`MotorCmd`)
- Position, velocity, torque setpoints
- Control mode selection
- Device ID targeting

**Motor Feedback** (`MotorFeedback`)
- Current position, velocity
- Motor current, temperature
- Error flags

Reference: `src/interfacing/can/include/can_node.hpp`

## Embedded (STM32) FDCAN Driver

### STM32G4 FDCAN Peripheral

The custom FOC motor controllers use the STM32G4's FDCAN peripheral for CAN communication.

**Hardware Configuration** (`FDCAN_STM32.cpp`)

| Parameter | Value |
| --- | --- |
| Instance | FDCAN2 |
| Frame format | Classic CAN |
| Mode | Normal |
| Nominal bitrate | ~1 Mbps (calculated from prescaler/segments) |
| GPIO pins | PB12 (RX), PB13 (TX) |
| Alternate function | AF9 (FDCAN2) |
| Interrupts | FDCAN2_IT0, FDCAN2_IT1 |

**Bus-Off Recovery** (`FDCAN_STM32.cpp`)
- Automatic detection of bus-off state
- Recovery by clearing INIT bit in CCCR register
- Error status callback handling

### Motor Control Loop Integration

The FDCAN driver is integrated into the FOC control loop:

**Setup Phase** (`foc.cpp`)
1. Initialize PWM for motor phases
2. Configure angle encoder (MT6835)
3. Initialize current sensing
4. Configure motor driver
5. Set PID parameters and call `motor.initFOC()`
6. Initialize FDCAN and enable RX interrupts

**Loop Phase** (`foc.cpp`)
1. Call `motor.loopFOC()` and `motor.move()`
2. Check ring buffer for CAN messages
3. Process motor commands
4. Send telemetry data back over CAN

Reference: `src/embedded/STM32/app/src/foc.cpp`

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
config.bitrate = 1000000;
config.receive_timeout_ms = 100;
```

**Example: SLCAN setup (CANable)**
```cpp
CanConfig config;
config.interface_name = "can0";
config.device_path = "/dev/canable";
config.bustype = "slcan";
config.bitrate = 1000000;  // Maps to "-s8" for slcand
```

Reference: `src/interfacing/can/include/can_core.hpp`

## Development & Testing

### Launch Files

Start the CAN interface node:
```bash
ros2 launch can can.launch.py
```

Reference: `src/interfacing/can/launch/can.launch.py`

### Testing Tools

**MIT protocol test** (`src/interfacing/can/test/test_mit_protocol.cpp`)
- MIT frame packing and feedback decoding for the GL II and AK drives

### Debugging

**Enable verbose logging** in `can_core.cpp`:
- Uncomment the debug logs in `CanCore::sendMessage()` for transmitted message logging
- Use `RCLCPP_DEBUG` level for received messages

**Monitor CAN traffic** (Linux):
```bash
# View raw CAN messages
candump can0

# Send test message
cansend can0 123#DEADBEEF
```

## Future Enhancements

- **CAN-FD support**: Increase bandwidth for higher-rate telemetry
- **Multi-bus architecture**: Separate buses for different limbs
- **Hardware filtering**: Reduce CPU load by filtering messages at hardware level
- **Time-stamping**: Precise synchronization with external sensors

## References

- [Electrical wiring diagram](/electrical)
- [Motor selection](/mechanical)
- SocketCAN documentation: https://www.kernel.org/doc/html/latest/networking/can.html
- DBC format: https://github.com/stefanhoelzl/CANpy
