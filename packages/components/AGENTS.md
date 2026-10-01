# Components package guidance

Before changing or reviewing this package, read the relevant sections of [CONTRIBUTING.md](./CONTRIBUTING.md). It covers compatibility, component APIs, styling, stories, and documentation. Existing components can have compatibility constraints that differ from the conventions for new components.

-   For package implementation or review, use the repository's [design-system-contribution](../../.agents/skills/design-system-contribution/SKILL.md) or [design-system-code-review](../../.agents/skills/design-system-code-review/SKILL.md) skill, respectively.
-   For Emotion migrations, use [emotion-to-scss-modules](../../.agents/skills/emotion-to-scss-modules/SKILL.md).
-   For consumer component selection, follow [Choose a recommended component](../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component). This package remains supported; moving an existing consumer to `@wordpress/ui` requires a separate compatibility assessment.

Check the affected component's README, types, stories, and consumers before changing its contract. Use the [cross-package guide](../../docs/contributors/design/design-system-packages.md#verify-the-affected-behaviour) to select verification for the changed behaviour.
