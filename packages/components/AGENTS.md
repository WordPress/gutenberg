# Components package guidance

Use [design-system-contribution](../../.agents/skills/design-system-contribution/SKILL.md) for package implementation and [design-system-code-review](../../.agents/skills/design-system-code-review/SKILL.md) for review. Read the guidance relevant to the change:

-   [CONTRIBUTING.md](./CONTRIBUTING.md) for component APIs, compatibility, styling, stories, and documentation. Existing components can have compatibility constraints that differ from the conventions for new components.
-   The affected component's README, types, stories, and consumers before changing its contract.
-   Changelogs: do not edit `CHANGELOG.md` directly. Create a fragment using `npm run changelog:add -- -j components -k "<Kind>" -m "PR=<PR>" -b "<Description>"` or write `.changes/unreleased/<PR>__components__<kind>.yaml` directly.

For consumer component selection, follow [Choose a recommended component](../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component). This package remains supported; do not migrate existing consumers to `@wordpress/ui` just because it is newer.
