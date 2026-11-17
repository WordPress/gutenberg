# UI package guidance

Use [design-system-contribution](../../.agents/skills/design-system-contribution/SKILL.md) for package implementation and [design-system-code-review](../../.agents/skills/design-system-code-review/SKILL.md) for review. Read the sections relevant to the change:

-   [Design principles](./CONTRIBUTING.md#design-principles) and [Public APIs](./CONTRIBUTING.md#public-apis) for reusable component behavior and API changes.
-   [Render props and refs](./CONTRIBUTING.md#render-prop-and-ref-forwarding) and [Overlay slot props](./CONTRIBUTING.md#overlay-slot-props) for composition changes.
-   [CSS architecture](./CONTRIBUTING.md#css-architecture), including the custom-property policy, for styling changes.
-   [Component status](./CONTRIBUTING.md#component-status) when status or exports change, so recommendation metadata stays consistent.
-   [Setup](./README.md#setup) when stylesheet, document, or overlay integration changes.
-   Changelogs: packages use Changie fragments; refer to the `package-changelog` skill when adding, updating, or reviewing entries. Do not edit `CHANGELOG.md` directly.

Keep product-specific behavior in the consuming package. Use the [cross-package guide](../../docs/contributors/design/design-system-packages.md#change-a-package-safely) for compatibility and verification.
