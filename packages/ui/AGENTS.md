# UI package guidance

Before changing or reviewing this package:

-   Read [README.md](./README.md) when package roles, public usage, or setup are relevant.
-   Read the relevant sections of [CONTRIBUTING.md](./CONTRIBUTING.md) before changing component APIs or styles. In particular, check its render/ref patterns, overlay slots, CSS layers, and custom-property policy for those changes.
-   Use [design-system-contribution](../../.agents/skills/design-system-contribution/SKILL.md) for implementation and [design-system-code-review](../../.agents/skills/design-system-code-review/SKILL.md) for review.

Keep reusable package behaviour separate from product-specific composition. Use the [cross-package guide](../../docs/contributors/design/design-system-packages.md#change-a-package-safely) for that boundary and completion checks. When changing component status or exports, follow [Component status](./CONTRIBUTING.md#component-status) so recommendation metadata stays consistent.
