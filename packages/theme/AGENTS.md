# Theme package guidance

Use [design-system-contribution](../../.agents/skills/design-system-contribution/SKILL.md) for package implementation and [design-system-code-review](../../.agents/skills/design-system-code-review/SKILL.md) for review. Read the sections relevant to the change:

-   [Public API](README.md#public-api) for supported exports, tokens, and compatibility boundaries.
-   [Theme Provider](README.md#theme-provider) for provider behavior, nesting, and document setup.
-   [Design Tokens Maintainer's Guide](tokens/README.md) and [Building](README.md#building) for token sources and generated output. Read these before editing generated assets, even when the target file is outside `tokens/`.
-   [Build Plugins](README.md#build-plugins) or [Stylelint Plugins](README.md#stylelint-plugins) for tooling changes.

Use the [cross-package guide](../../docs/contributors/design/design-system-packages.md#change-a-package-safely) for consumer checks and verification. Scope checks to the affected runtime or tooling entrypoint rather than treating every theme change as a provider change.
