# Tooling, dependencies, CI, generated artifacts, and releases

Use this reference for workspace packages, build configuration, scripts,
workflows, generated output, plugin ZIPs, dependency changes, and publishing.

## Dependencies and workspaces

- Declare each imported or executed dependency in the workspace that consumes
  it, with the correct dependency role. Do not add workspace-only dependencies
  to the repository root.
- Update the root `package-lock.json` through supported npm workspace commands.
  Run dependency, root-dependency, lockfile, and license validators.
- Register TypeScript project references for typed workspace dependencies and
  use supported public package entry points.
- Do not rely on hoisting, the current working directory, or undeclared root
  packages. Exercise isolated resolution where a build or subprocess could
  resolve from the wrong owner.
- Production dependencies shipped by packages with `wpScript` or
  `wpScriptModuleExports` must be GPLv2-compatible; manually inspect malformed
  license metadata rather than silently excluding it.

## Builds and generated output

- Treat documented source files as authoritative. Edit the source, run the
  repository generator, review its diff, and ensure regeneration leaves no
  uncommitted governed output.
- Use repository root/workspace commands rather than `npx` for WordPress's
  local or forked tooling.
- For package/build changes, build production artifacts and verify declared
  files, entry points, exports, types, styles, side effects, and WordPress
  exposure against the output.
- Keep centralized lint suppressions and dependency-audit exceptions narrowly
  scoped; prune entries that no longer correspond to a current violation.
- Run the applicable supported CI target matrix when runtime compatibility or
  generated output differs by Node, PHP, WordPress, browser, or environment.

## Workflow and release safety

- Validate credentials, permissions, environment variables, version state, and
  remote prerequisites before version bumps, pushes, publishes, or other
  irreversible mutations.
- Analyze concurrency and cancellation. Prevent two runs from publishing the
  same version and prevent cancellation from leaving a partially mutated
  release.
- Make retries idempotent: inspect remote and registry state, resume safely
  after partial completion, and print actionable recovery commands.
- Include tool versions in cache/reproducibility inputs when those versions
  affect generated or installed state; pin versions where alignment matters.
- Build plugin ZIPs through `bin/build-plugin-zip.sh` from a clean,
  commit-traceable worktree. Retain the uploaded artifact for the GitHub release
  and deploy that release asset to WordPress.org rather than rebuilding.
