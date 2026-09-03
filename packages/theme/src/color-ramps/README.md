# Building color ramps

For the public API, see the [package README](../../README.md). This guide covers the algorithm behind the semantic tokens.

## Goals

A ramp contains related surface, stroke, fill, and foreground colors. The goals are balanced-looking steps across light and dark themes, retained seed character, and a stronger foreground for interaction states.

Perceptual spacing is a preference; configured WCAG contrast floors take priority. A seed is a starting point, not a promised output color. Its lightness may shift to make the base constraints fit. Searches are bounded, so difficult seeds can still produce compressed steps or contrast warnings.

## Configuration

[`lib/ramp-configs.ts`](./lib/ramp-configs.ts) defines background and accent ramps. Backgrounds start from `surface2`; accents start from `bgFill1`.

| Setting                             | Purpose                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `steps`                             | Base colors: contrast references, WCAG ratios, direction, optional lightness preferences, and tapering of chroma, or color intensity. |
| `sameAsIfPossible`                  | Reuse a base color only if it passes the step's contrast checks.                                                                      |
| `foregroundScale`                   | Foreground seed, background reference, chroma policy, and WCAG floors.                                                                |
| `foregroundScale.perceptualTargets` | Preferred foreground contrast and gaps, measured with APCA in Lc. These are not accessibility thresholds.                             |

`main` follows the ramp's lighter or darker direction; `opposite` reverses it. `best` chooses using contrast against black and white. A base target of `1` copies its reference. Base lightness preferences apply only when contrast permits; the accent surface anchor uses an explicit lightness pin.

## Build flow

1. **Choose the background direction.** [`buildBgRamp`](./index.ts) starts with the black or white endpoint offering more WCAG contrast. Near the crossover, it can compare both directions, accepting a switch only within the seed-drift and contrast checks.
2. **Solve base colors.** [`buildRamp`](./lib/index.ts) builds dependencies first and searches OKLCH lightness for each contrast target. Chroma tapering preserves the authored desaturation choices. If a required target fails, it searches for an adjusted seed lightness and rebuilds the base ramp.
3. **Rebalance surfaces and strokes.** [`buildPerceptualSteps`](./lib/build-perceptual-steps.ts) owns these spacing rules. Surfaces use OKLr lightness, retaining each step's hue and chroma before fitting it into sRGB. SF1–SF3 run from darker to lighter around SF2. SF4–SF6 extend beyond them in the ramp's main direction. Strokes use OKLab to measure color differences, with WCAG checks and ST1 as an anchor.
4. **Place foregrounds.** [`buildForegroundScale`](./lib/build-foreground-scale.ts) uses APCA, which treats light-on-dark and dark-on-light contrast differently. It compares foregrounds to the background ramp's reference. Neutral foregrounds retain tapering; accents preserve the seed's share of available chroma. WCAG floors apply to configured surfaces in both ramps. If the preferred gaps cannot fit, FGS4 moves toward its WCAG floor to leave range for FGS5. Rounded hex output is checked and corrected where possible.
5. **Build accents, then map tokens.** Accents run the same passes, inheriting the completed background's direction and a bounded version of its SF2 lightness. [`use-theme-provider-styles.ts`](../use-theme-provider-styles.ts) maps the results to semantic CSS properties using the generated alias map.

Surface foregrounds use FGS2 for disabled controls, FGS3 for weak emphasis, FGS4 for normal content and resting controls, and FGS5 for interaction states. FGS5 can approach black or white at the expense of chroma. FGS1 is no longer generated. Strong fills use separate foregrounds. See [`tokens/color.json`](../../tokens/color.json) for exact mappings.

Runtime accent profiles skip output work that semantic tokens do not use: `interactive` for primary/error and `status` for the other accents. They retain dependencies and spacing budgets that affect visible colors. Generation and diagnostics use `full` ramps.

## Checks and generated files

Ramp warnings report unmet step constraints. [`theme-provider-color-warnings.ts`](../theme-provider-color-warnings.ts) also checks listed semantic text/background pairs. The separate `checkAccessibleCombinations` diagnostic checks a broader matrix, including cross-ramp pairs that semantic tokens may not use. Neither warning collector repairs colors or proves every possible pairing accessible.

After changing configuration or the algorithm, run this from the repository root:

```sh
npm run build --workspace @wordpress/theme
```

This regenerates default ramps first, then primitive colors in `tokens/color.json`, CSS, alias maps, fallbacks, and token documentation. Commit the generated changes; do not edit them directly. Semantic aliases in `tokens/color.json` remain hand-authored. See the [token maintainer guide](../../tokens/README.md) for that layer.

Check the color-ramp tests and Storybook's **Theme Provider → Color Scales → Sample Combinations**. Inspect ordering, seed character, foreground state differences, and warnings across light, dark, mid-gray, and saturated seeds.
