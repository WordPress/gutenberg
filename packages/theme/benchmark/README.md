# Color ramp benchmark

This benchmark measures uncached color-ramp calculation. It covers one
background ramp, one accent ramp against a precomputed background, and the full
`ThemeProvider` ramp workload of one background plus six accent ramps. Each case
cycles through the default light seed, a dark `#1e1e1e` background, and the
Ectoplasm admin color scheme.

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

Both worktrees need their dependencies installed. Add `--json` to save
machine-readable results. Compare runs made with the same Node.js version and
similar system load. The benchmark reports measurements but does not enforce a
timing threshold because local and CI timings vary.
