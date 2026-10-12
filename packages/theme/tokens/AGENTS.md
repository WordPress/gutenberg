# Token source guidance

Read the [Design Tokens Maintainer's Guide](README.md) before editing token definitions, modes, or the resolver. Follow the package's [build procedure](../README.md#building) to regenerate derived assets rather than editing generated output independently.

For a public token change, follow the [contract comparison](../../../docs/contributors/design/design-system-packages.md#compare-contracts-before-replacing-an-api). Inspect generated CSS, token names and types, documentation, and fallback outputs affected by the change. Verify consumers in the affected modes; matching a token's default value does not establish equivalent semantics.
