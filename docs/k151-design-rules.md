# NURI Suit design rules for the StackChan K151

Measured from M5Stack's published K151 structure files
([m5stack/M5_Hardware › Products/K151_StackChan/Structures](https://github.com/m5stack/M5_Hardware/tree/master/Products/K151_StackChan/Structures))
and the K151 documentation. Every accessory in `nuri-studio.html` is checked against these rules in the browser.

> The STL files are individual parts, not an assembly. Part sizes, hole positions and the rear chamfer are measured.
> The head-to-base gap is derived from the official overall size. **The tilt pivot position is estimated** and must be
> confirmed on a physical K151 before tooling.

## Measured geometry

| Part (STL) | Size W × D × H (mm) | Role |
|---|---|---|
| `StackChan-MainBody` | 54.0 × 46.7 × 54.0 | Head shell. The CoreS3 forms the front face. Moves with pan **and** tilt. |
| `StackChan-Base` | 48.0 × 56.0 × 11.1 | Stationary base with the pan turntable (Ø ≈ 42 mm ring). |
| `StackChan-ServoBody` | 46.5 × 46.0 × 35.8 | Pan/tilt servo housing, round foot Ø ≈ 46 mm. Sits mostly inside the head. |
| `StackChan-ServoArm` / `BearingFixture` | 24 / 16 mm long | Link the tilt servo to the head on each side. |
| `StackChan-LightGuideBar-A/B` | 5 × 31 mm | RGB LED light bars, one along each top side edge of the head. |

- Overall K151: **54 × 61.5 × 70.5 mm**. Head (54) + base (11.1) leaves a **≈ 5.4 mm gap** between head and base. There is no visible neck.
- **Side holes:** 3 per side, **Ø ≈ 4.3 mm, 8 mm pitch** (Technic-style spacing), centres **11.6 mm below the top**, at ≈ 8 / 16 / 24 mm behind the front face.
- **Rear-bottom chamfer:** ≈ 10 × 10 mm. It clears the servo body when the head tilts.

## Motion envelope

- **Pan:** ±130° under firmware control (the servo itself can rotate further). The head and everything attached to it sweep a circle of ≈ 39 mm radius above the base.
- **Tilt:** M5Stack recommends 5–85° on the vertical axis. In the studio that is modelled as **6° nose-down to 74° nose-up** from the resting pose. Driving past this range can stall and damage the servo.

## Rules per wardrobe zone

| Zone | Mounts on | Must not |
|---|---|---|
| Headwear | Side holes (straps, posts, clips) | Cover the top surface: 3 capacitive touch zones and both LED bars. Anything crossing over the top keeps **≥ 12 mm** clearance. |
| Facewear | Clip around the outside of the CoreS3 front edge | Overlap the 2.0" display or the camera. Extend **below the head's bottom edge**, because the 5 mm gap would close when NURI looks down. |
| Sidewear | Side holes | Hang below the head, or reach back into the rear chamfer / servo space. |
| Outfit | Upper band of the **stationary base** | Rise above the base top (11.1 mm), because the head sweeps over it while panning. |
| Basewear | Lower base / plinth underneath | Rise above the base top within the head's pan sweep. Block the charging path or the base underside. |

General rules:

- Snap-on and non-invasive only: no glue or screws into the K151, and keep the USB-C port and CoreS3 side ports reachable (verify their positions on a sample).
- Keep head-mounted parts light. The tilt servo carries everything attached to the head.
- Ventilation, microphones and speaker openings stay open. Confirm their exact locations on a physical unit.

## Before production

1. Measure a real K151: tilt pivot axis, port and vent positions, and the actual head-to-base gap at full tilt.
2. Print the Signature, Gamer and Futuristic kits and run the full pan/tilt range with each mounted.
3. Check servo current and stability with the heaviest headwear and sidewear combination.
4. Update the constants at the top of the studio script (`BT`, `GAP`, `PIVOT`, `HOLES`, tilt limits) with the measured values.
