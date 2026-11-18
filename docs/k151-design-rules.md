# NURI design rules for the StackChan K151

Measured from M5Stack's published K151 structure files
([m5stack/M5_Hardware › Products/K151_StackChan/Structures](https://github.com/m5stack/M5_Hardware/tree/master/Products/K151_StackChan/Structures))
and the K151 documentation. Every suit part and dock in `assets/nuri3d.js` follows these rules, and `checkClearance()` re-checks the suit parts in the browser.

> The STL files are individual parts, not an assembly. Part sizes, hole positions, the rear chamfer and the base USB-C opening are measured.
> The head-to-base gap and the CoreS3 depth are derived from the official overall size. **The tilt pivot position is estimated.**
> Confirm all of these on a physical K151 before tooling.

## Measured geometry

| Item | Size / position | Notes |
|---|---|---|
| Overall K151 | 54 × 61.5 × 70.5 mm (W × D × H) | Official figure |
| Base (`StackChan-Base`) | 48 × 56 × 11.1 mm | Stationary. Holds the battery (550–700 mAh is quoted in different sources). |
| Base USB-C | Opening ≈ 11.7 × 3.6 mm on one short end face, ≈ 5.5 mm up | M5Stack recommends charging and data through this port, because the head moves. Modelled on the rear. |
| Head shell (`StackChan-MainBody`) | 54 × 46.7 × 54 mm | Pans and tilts. |
| CoreS3 | 54 × 54 × ≈ 14.8 mm, in front of the shell | Display, camera, mics. Left side: USB-C port and power button. |
| Head-to-base gap | ≈ 5.4 mm | No visible neck; the servo body (Ø ≈ 46 mm) sits inside the head. |
| Side holes | 3 per side, Ø ≈ 4.3 mm, 8 mm pitch, 11.6 mm below the top | Centres ≈ 8 / 16 / 24 mm behind the shell front, so they are behind the CoreS3. |
| Rear chamfer | ≈ 10 × 10 mm, back-bottom of the shell | Clears the servo body when tilting. |
| Top of shell | 3 capacitive touch zones and two LED light bars (5 × 31 mm) along the side edges | Must stay uncovered. |

## Motion envelope

- **Pan:** ±130° under firmware control. The head sweeps a circle of ≈ 41 mm radius above the base.
- **Tilt:** M5Stack recommends 5–85°. Modelled as 6° nose-down to 74° nose-up from rest. Driving past this can stall the servo.

## Suit rules (3 looks: Signature, Focus, Buddy)

| Part | Mounts on | Must not |
|---|---|---|
| Face frame | Clips over the front 3.5 mm of the CoreS3 edge | Cover the display or camera. Extend below the head (the bottom rail stays inside the outline). Reach back over the CoreS3 left-side USB-C or power button. |
| Side pieces | The 3 side holes, behind the CoreS3 | Hang below the head or reach into the rear chamfer. |
| Top pieces (Focus band, Buddy ears) | Side holes | Cover the touch zones or LED bars. Anything crossing above keeps **≥ 12 mm** clearance. |

All parts are snap-on: no glue, no screws into the K151. Keep head-mounted parts light, because the tilt servo carries them.

## Dock rules (2 docks: Slim, included · Nest, +RM50)

- **Charging:** a fixed USB-C plug in the pocket's rear wall lines up with the base USB-C port when NURI slides in from the front. The dock has its own USB-C input for the power adapter. NURI keeps working while it charges.
- **Pan clearance:** pocket walls stay **below the base top (11.1 mm)**, so the head can turn freely over them. The front wall is lower (4 mm) to slide NURI in and out.
- **Ventilation:** the base rests on three ribs, leaving a **2 mm air gap** under the battery and power IC. Side walls have vent slots. Nothing seals the base underside.
- **Slim Dock:** soft rounded slab (4.5 mm, 10 mm corner radius) with a continuous U-shaped rim that is open at the front so NURI slides onto the USB-C plug. Three slim vents per side, a thin accent line, and the engraving on top of the front lip.
- **Nest Dock:** shallow round bowl (Ø ≈ 110 mm) wrapped in nine thin woven rings. Every ring sits outside the head's ≈ 41 mm pan sweep, so rings may rise above the base top without touching the head; the gaps between rings act as vents. Engraved tag on the front of the rim, three rubber feet.
- **Stability:** rubber feet on both docks. The browser clearance check also flags any dock part that rises above the base top inside the pan sweep.
- **Engraving:** `NURI` + the companion's name (up to 10 characters), on the Slim Dock's front lip or the Nest Dock's front tag. Free.

## Add-ons (optional, concept)

- **NURI Rover:** a tracked base with the same pocket and USB-C plug as the docks, powered by its own battery. NURI sits on it exactly as on a dock.
- **NURI Board:** a slim 10.1" display (6.5 mm) on a minimal aluminium stand, linked to the NURI app over Wi-Fi with its own USB-C power. The K151 cannot drive an external display directly, so the Board is not wired to it.

## Before production

1. Measure a real K151: tilt pivot axis, base USB-C position and depth, CoreS3 port positions, and the head-to-base gap at full tilt.
2. Print one suit per look and one of each dock. Run the full pan/tilt range and a full charge cycle in each dock.
3. Check servo current with the heaviest suit (Focus) and base temperature while charging in each dock.
4. Update the constants at the top of `assets/nuri3d.js` (`K`) with the measured values.
