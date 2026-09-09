# patch

Creates and applies the dependency patches in [`patches/`](../../../patches).

`patch-package` cannot be used: it looks for packages at nested `node_modules/` paths that `install-strategy=linked` does not create, and refuses to diff a directory containing symlinks into the store.

## Usage

```bash
# Apply every patch. Runs from the repository root's postinstall.
npm run --workspace @wordpress/monorepo-tools patch -- apply

# Edit the installed package first, then write patches/<name>+<version>.patch.
npm run --workspace @wordpress/monorepo-tools patch -- create <package-name>
```

`create` also updates an existing patch, and removes it when the package matches its published tarball.

## Reference

| Export                                 | Purpose                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `applyPatches`                         | Applies every patch, to every installed copy. Idempotent.                     |
| `createPatch`                          | Diffs an installed package against its published tarball.                     |
| `findPackageDirs`                      | Resolves a package across the hoisted, workspace-nested and `.store` layouts. |
| `retargetPatch`                        | Rewrites patch headers onto a package's real location.                        |
| `patchFileName` / `parsePatchFileName` | Encode and decode `<name>+<version>.patch`.                                   |

Notes for anyone changing this:

-   A name and version can have several `.store` copies under different hashes, so every copy is patched.
-   Store directory names embed a hash, so `foo@1.2.3-<hash>` and `foo@1.2.3-beta-<hash>` share a prefix. Versions are confirmed from the manifest.
-   Only header lines are retargeted, so hunk payloads that look like paths survive intact.
-   `--unidiff-zero` is required for zero-context hunks but matches loosely, so a patch counts as applied only when the reverse direction applies and the forward one does not.

npm v12's built-in `npm patch` and `patchedDependencies` will replace this. See [#82328](https://github.com/WordPress/gutenberg/issues/82328).
