# Color ramp benchmark

This benchmark calls the color-ramp builders directly, bypassing the
`ThemeProvider` whole-ramp memoization while retaining internal algorithm
caches. It covers one background ramp, one accent ramp against a precomputed
background, and the full `ThemeProvider` ramp workload of one background plus
six accent ramps. Accent calls use the same internal purpose as `ThemeProvider`:
`interactive` for brand/error and `status` for info/success/caution/warning.
Historical algorithms ignore this extra argument. Each case cycles through the
default light seed, a dark `#1e1e1e` background, and the Ectoplasm sample
(`#413256` background and `#a3b745` primary).

Run it from the repository root:

```sh
npm run benchmark:color-ramps --workspace @wordpress/theme
```

To compare two checkouts on the same machine, run the benchmark script from the
candidate checkout and point it at a prepared baseline worktree:

```sh
npm run benchmark:color-ramps --workspace @wordpress/theme -- \
	--baseline-root /path/to/gutenberg-trunk \
	--baseline-label trunk \
	--label candidate
```

Both worktrees need their dependencies installed. Add `--json` for
machine-readable output. The checksum covers every generated ramp token. It
changes when unused steps are omitted, even if semantic colors are identical;
use semantic parity tests to distinguish pruning from color drift. Compare runs
made with the same Node.js version and similar system load. The benchmark reports measurements but
does not enforce a timing threshold because local and CI timings vary.

See [the step-pruning report](./step-pruning.md) for the measured before/after
results and the optimizations retained or rejected within this PR.
