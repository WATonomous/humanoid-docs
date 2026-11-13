import React from 'react';
import styles from './styles.module.css';

// Arm joint naming diagram (one arm, zero pose = hanging straight down).
// Colours come from Infima variables so it follows the light/dark toggle.

const ARM_X = 110;

const GROUPS = [
  {name: 'shoulder', top: 46, bottom: 174},
  {name: 'elbow', top: 226, bottom: 314},
  {name: 'wrist', top: 356, bottom: 444},
  {name: 'gripper', top: 476, bottom: 524},
];

const JOINTS = [
  {i: 0, y: 70, name: 'shoulder.pitch', desc: 'swings the arm forward / back'},
  {i: 1, y: 110, name: 'shoulder.roll', desc: 'lifts the arm out to the side'},
  {i: 2, y: 150, name: 'shoulder.yaw', desc: 'twists the upper arm along its length'},
  {i: 3, y: 250, name: 'elbow.pitch', desc: 'bends the elbow'},
  {i: 4, y: 290, name: 'elbow.yaw', desc: 'twists the forearm along its length'},
  {i: 5, y: 380, name: 'wrist.pitch', desc: 'tilts the hand forward / back'},
  {i: 6, y: 420, name: 'wrist.yaw', desc: 'swings the hand side to side', isNew: true},
  {i: 7, y: 500, name: 'gripper.open_close', desc: '0 = open … 1 = closed'},
];

const LINKS = [
  {label: 'upper arm', y: 200},
  {label: 'forearm', y: 335},
  {label: 'hand', y: 460},
];

export default function ArmJointNaming() {
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.svg}
        viewBox="0 0 680 580"
        role="img"
        aria-labelledby="arm-naming-title arm-naming-desc">
        <title id="arm-naming-title">Arm joint naming</title>
        <desc id="arm-naming-desc">
          One arm in its zero pose, hanging straight down from the torso. Joints
          from shoulder to gripper with their ArmPose index and group.axis name:
          0 shoulder.pitch, 1 shoulder.roll, 2 shoulder.yaw, 3 elbow.pitch, 4
          elbow.yaw, 5 wrist.pitch, 6 wrist.yaw (new, dual-axis wrist motor), 7
          gripper.open_close.
        </desc>

        {/* group bands */}
        {GROUPS.map((g) => (
          <g key={g.name}>
            <rect
              className={styles.band}
              x={140}
              y={g.top}
              width={530}
              height={g.bottom - g.top}
              rx={8}
            />
            <text className={styles.groupLabel} x={658} y={g.top + 18} textAnchor="end">
              {g.name}
            </text>
          </g>
        ))}

        {/* torso */}
        <rect className={styles.torso} x={10} y={40} width={62} height={60} rx={6} />
        <text className={styles.linkLabel} x={41} y={75} textAnchor="middle">
          torso
        </text>
        <line className={styles.link} x1={72} y1={70} x2={ARM_X} y2={70} />

        {/* arm links */}
        <line className={styles.link} x1={ARM_X} y1={70} x2={ARM_X} y2={500} />
        {LINKS.map((l) => (
          <text key={l.label} className={styles.linkLabel} x={ARM_X - 18} y={l.y + 4} textAnchor="end">
            {l.label}
          </text>
        ))}

        {/* gripper fingers */}
        <path className={styles.link} d={`M ${ARM_X - 16} 512 V 540 M ${ARM_X + 16} 512 V 540 M ${ARM_X - 16} 512 H ${ARM_X + 16}`} />

        {/* joints and labels */}
        {JOINTS.map((j) => (
          <g key={j.name}>
            <line
              className={j.isNew ? styles.leaderNew : styles.leader}
              x1={ARM_X + 13}
              y1={j.y}
              x2={162}
              y2={j.y}
            />
            <circle
              className={j.isNew ? styles.jointNew : styles.joint}
              cx={ARM_X}
              cy={j.y}
              r={13}
            />
            <text className={j.isNew ? styles.indexNew : styles.index} x={ARM_X} y={j.y + 4.5} textAnchor="middle">
              {j.i}
            </text>
            <text className={j.isNew ? styles.nameNew : styles.name} x={168} y={j.y + 5}>
              {j.name}
            </text>
            <text className={styles.desc} x={346} y={j.y + 5}>
              {j.desc}
            </text>
            {j.isNew && (
              <text className={styles.newTag} x={346} y={j.y + 21}>
                NEW · dual-axis wrist motor
              </text>
            )}
          </g>
        ))}

        <text className={styles.note} x={10} y={572}>
          Zero pose: arm hanging straight down (command frame = URDF frame). Numbers are ArmPose indices.
        </text>
      </svg>
    </figure>
  );
}
