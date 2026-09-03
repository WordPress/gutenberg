# Ramp step pruning

## Goal and boundaries

Reduce theme-generation work without changing any semantic color, its contrast
requirements, or the public ThemeProvider API. Keep the existing local
`bgFill2.followDirection: 'main'` change.

## Plan

1. Remove FGS1, `bgFillDark`, and `fgFillDark` from generation. No semantic token
   uses them, and no retained color depends on them. Update internal diagnostics
   and generated fixtures while preserving the public warning step-name type.
2. Add an internal accent-purpose string union, `full`, `interactive`, or
   `status`, if the measured saving justifies it. Brand and error use
   `interactive`; info, success, caution, and warning use `status`. Storybook
   and full-ramp diagnostics retain `full`. Do not add a ThemeProvider prop.
3. Probe skipping accent ST2 reconstruction, then its base calculation if
   removing that constraint preserves all retained outputs.
4. Probe skipping status ST4 repair and FGS5 final serialization/interval
   correction. Keep foreground spacing and the strong color used as a bound
   when serializing retained foregrounds. Do not replace required anchors with
   approximate colors or weaken semantic contrast checks.
5. Consider skipping SF6's final reconstruction, but retain its authored
   spacing contribution to SF4/SF5. Keep this separate from the first probes.
6. Keep only changes that preserve output and earn their complexity in repeated
   benchmarks. Record discarded probes as well as retained changes.

## Verification

The author approved this regression coverage:

-   Omit unused steps.
-   Preserve exact semantic colors for each ramp purpose.
-   Preserve the existing contrast checks.
-   Keep cached results distinct between ramp purposes.

Compare against a frozen copy of the current working tree, including all 13
Storybook samples, a 216-color background cube, and the same primary-color cube
against light, dark, and middle-gray backgrounds. Check all mapped values and
warning payloads. Run focused unit tests, formatting/lint, type checks, and
token generation. Public generated CSS/JS token values must not change.

Benchmark before/after in separate, sequential Node processes. Report the
generation workload separately from cache hits and browser rendering. Use
semantic parity checks rather than expecting a raw all-step checksum to match
after internal steps have been removed.

## Result

Implemented locally on `codex/theme-feasibility-aware-perceptual-ramps`.
This comparison is **before versus after step pruning within this PR**, not
trunk versus this PR. The baseline is commit
`4bb53ec0db8705cb1cfbfc6df52434ad0f0e488b` plus the already-applied local
`bgFill2.followDirection: 'main'` change. Both sides use that direction change.

### Work removed

| Work                                              | Decision                 | Reason                                                                                                                                                                                                           |
| ------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FGS1, `bgFillDark`, `fgFillDark`                  | Remove entirely          | No semantic consumers or retained dependents.                                                                                                                                                                    |
| Base FGS4/FGS5 solves                             | Remove                   | These intermediate colors were overwritten. Their base 4.5:1 constraint against SF3 was already covered by FGS3. The final foreground pass still constructs FGS4/FGS5 and checks their full surface constraints. |
| Accent ST2 final reconstruction                   | Skip for runtime accents | No accent semantic token uses ST2. Keep its base solve.                                                                                                                                                          |
| Accent SF6 final color conversion                 | Skip for runtime accents | Keep the base SF6 color and perceptual spacing calculation that position SF4/SF5. Only its final output conversion is unused.                                                                                    |
| Status ST4 final repair                           | Skip for status ramps    | No status semantic token uses ST4. Its base constraint remains important.                                                                                                                                        |
| Status FGS5 serialization and interval correction | Skip for status ramps    | No status interaction-state token uses FGS5. Keep the strong foreground candidate and spacing budget that constrain FGS3/FGS4.                                                                                   |
| Accent ST2 base solve                             | Retain                   | Output parity passed, but the measured incremental saving was about 0.1%, insufficient to justify another conditional base configuration.                                                                        |
| Status ST4 base solve                             | Retain                   | Removing it changed semantic results in 521 of 877 combinations. Its contrast constraint affects seed adjustment.                                                                                                |

The enum-style option is an internal string union, not a new ThemeProvider prop:

| Purpose          | Caller                                                         | Returned steps per ramp |
| ---------------- | -------------------------------------------------------------- | ----------------------: |
| `full` (default) | Background, token generation, Storybook, full-ramp diagnostics |                      20 |
| `interactive`    | Primary and error runtime ramps                                |                      18 |
| `status`         | Info, success, caution, and warning runtime ramps              |                      16 |

The runtime returns 120 color fields across seven ramps, down from 161.
This is not a count of independent solves: retained fields and hidden anchors
still require different amounts of work. Public semantic tokens are not removed,
including tokens with no current literal consumer in this repository.
FGS2–FGS5 keep their existing names; they are not renumbered after FGS1 removal.

### Final production-path benchmark

Each cell below is the median of five process-level results. The p95 columns
are medians of the five process-level p95 values, not pooled percentiles.

| Workload                                   | Before median | After median | Change | Before p95 | After p95 |
| ------------------------------------------ | ------------: | -----------: | -----: | ---------: | --------: |
| Background ramp                            |      0.482 ms |     0.421 ms | −12.6% |   0.528 ms |  0.477 ms |
| Interactive accent, precomputed background |      1.758 ms |     1.613 ms |  −8.3% |   1.914 ms |  1.763 ms |
| Complete theme: background + six accents   |     12.165 ms |    10.831 ms | −11.0% |  13.800 ms | 11.505 ms |

The five paired full-theme medians were:

| Run |    Before |     After | Change |
| --- | --------: | --------: | -----: |
| 1   | 12.082 ms | 10.899 ms |  −9.8% |
| 2   | 12.151 ms | 10.773 ms | −11.3% |
| 3   | 12.203 ms | 10.741 ms | −12.0% |
| 4   | 12.165 ms | 10.831 ms | −11.0% |
| 5   | 12.195 ms | 10.905 ms | −10.6% |

Environment: Node.js v20.20.2, macOS arm64. Each process used eight warmup
samples and 30 measured samples, with 20 ramp calls or five complete themes
per sample. Processes ran sequentially, alternating before/after order between
pairs, without concurrent builds or probes. Fixtures were default light,
default dark, and Ectoplasm (`#413256` / `#a3b745`) on both sides.

These measurements bypass ThemeProvider's whole-ramp memoization and retain
internal color-algorithm caches. They do not measure browser rendering, a
cold page load, or the usual memoized cache-hit path. Raw all-step checksums
are stable within each version but differ between versions because fields
were removed and insertion order changed. Semantic equality was checked
separately.

The checked-in benchmark now passes the same purpose arguments as the runtime.
Use it with a prepared baseline checkout, then repeat with the process order
reversed:

```sh
npm run benchmark:color-ramps --workspace @wordpress/theme -- \
	--baseline-root /path/to/baseline \
	--baseline-label before-pruning \
	--label after-pruning
```

### Exploratory probes, not additive savings

These earlier measurements used a diagnostic driver, before the final SF6
skip. Each row reports the median of five process medians. The driver rebuilt
temporary configuration objects between calls, so use the production-path
table above for the final result. Differences between these rows are useful
for deciding which probes to pursue, not precise isolated cost estimates.

| Cumulative probe                                    | Full-theme median | Change versus its baseline |
| --------------------------------------------------- | ----------------: | -------------------------: |
| Baseline                                            |         12.341 ms |                          — |
| Remove the three globally unused steps              |         12.011 ms |                      −2.7% |
| Also skip accent ST2 and status ST4/FGS5 final work |         11.591 ms |                      −6.1% |
| Also omit accent ST2's base solve                   |         11.580 ms |                      −6.2% |
| Also omit base FGS4/FGS5 solves                     |         11.173 ms |                      −9.5% |

The last two rows were probes, not the exact final implementation. The final
code keeps accent ST2's base solve, removes redundant base FGS4/FGS5 solves,
and skips accent SF6's final conversion. SF6's saving was not measured in
isolation. The status ST4 base-deletion probe was rejected on output parity
before using its timing to make a decision.

Local raw results and frozen source snapshots are in
`/private/tmp/theme-step-pruning.20QyaP/`. The results file is
`benchmark-results.json`; these scratch files are not part of the PR.

### Verification completed

-   877 theme combinations / 6,139 ramps: all 13 Storybook samples, a 216-color
    background cube, and a 216-color primary cube on light, dark, and middle-gray
    backgrounds. Every retained color, semantic value, direction, and warning
    payload matched the frozen baseline. No checked contrast failures or warnings.
-   Both full-ramp snapshots match the baseline exactly after deleting only
    FGS1, `bgFillDark`, and `fgFillDark` fields (1,377 removed snapshot lines).
-   174 theme Node/Vitest tests and 35 ThemeProvider/JSDOM tests pass. New tests
    cover omission, semantic parity by purpose, foreground/stroke contrast,
    redundant base foreground removal, and cache isolation between purposes.
-   Theme type checks, changed-file JavaScript lint, and theme token generation
    pass. No full-repository build or browser performance test was run here.
-   Public prebuilt CSS/JS, token types, fallback SCSS, and token documentation
    are unchanged. The generated internal alias map changes key order only;
    its mappings are identical. The public warning step-name union is preserved.

### Further scope

Do not add a per-step bitmask or caller-supplied skip list. The three purposes
encode known semantic usage, and the parity tests will catch a future mapping
that needs an omitted step. More aggressive removal of status fills or
foreground anchors would need a separate dependency/constraint analysis;
being unmapped is not sufficient evidence that their calculations are unused.
