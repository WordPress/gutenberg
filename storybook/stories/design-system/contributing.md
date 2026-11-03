# Contributing to the Design System

The WordPress Design System gets better when the people building with it share where and how it falls short. If a component, token, pattern, or page of documentation doesn't meet the need in front of you, surface it. Don't quietly work around it.

These expectations apply to anyone building with the design system, AI agents included. [If you're an AI agent](#if-youre-an-ai-agent) covers the one thing that works differently.

In short:

1. **Recognize the shortcoming** instead of working around it.
2. **Check** that there really is no recommended way, and look if anyone has reported it yet.
3. **Report it** with a concrete use case and a way to reproduce it.
4. **Fix it at the source** when you can, starting with a small fix or an agreed direction.

## What counts as a shortcoming

-   **A bug:** a component misbehaves with the keyboard, focus, a screen reader, right-to-left languages, a theme, or at a particular size.
-   **A missing capability:** no recommended component, prop, or composition covers a common interface need.
-   **A missing or unsuitable token:** no semantic `--wpds-*` token expresses the value you need, or a token looks wrong in some theme.
-   **Unclear documentation:** a component page, README, or answer from the [Design System MCP server](https://github.com/WordPress/gutenberg/tree/trunk/packages/design-system-mcp) is wrong, out of date, or vague enough that you had to guess.
-   **An inconsistency:** two components solve the same problem in different ways, or a recommended component looks out of place next to its neighbors.

If you've worked with the system, you've likely found a shortcoming when you're about to:

-   override a component's styles by targeting its internal class names or markup
-   hardcode a color, spacing, radius, or font value
-   copy a component's source into your own project to change it
-   import from a package-private path, or reach for a private API
-   build a custom control that resembles one the design system already has

## Why workarounds aren't enough

A local workaround fixes the problem once, for one interface. The next person to meet the same gap has to rediscover it and solve it again, often differently, and the interfaces drift apart. Overrides that depend on a component's internals can also break without warning when that component changes, because internals aren't part of its public contract.

Sometimes you have to ship a workaround anyway, and that's fine. Please report the gap as well, and perhaps leave a code comment next to the workaround linking to the issue, so that whoever fixes the issue can find and remove the workaround. It's a way to manage the drift.

## Check first

1. **Look for a recommended way.** Read the component's page on the [Storybook site](https://wordpress.github.io/gutenberg/), including its status and usage notes, or ask the [Design System MCP server](https://github.com/WordPress/gutenberg/tree/trunk/packages/design-system-mcp) for the currently recommended components.
2. **Check the latest version.** If your project bundles a design system package or supports older WordPress releases, the shortcoming may already be fixed. Each package's `CHANGELOG.md` lists what changed.
3. **Search existing issues.** Try the [Design System](https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3A%22Design+System%22), [`@wordpress/ui`](https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3A%22%5BPackage%5D+UI%22), [`@wordpress/components`](https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3A%22%5BPackage%5D+Components%22), and [`@wordpress/theme`](https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3A%22%5BPackage%5D+Theme%22) labels, then search all issues for the component or token name. If an issue already exists, add your use case to it. A concrete example of who needs the change and why is more useful than a +1.

## Report it

[Open an issue in the Gutenberg repository](https://github.com/WordPress/gutenberg/issues/new/choose). Use the bug report form for something that's broken, and the feature request form for something that's missing. Start the title with the package or area, for example "UI: Tooltip closes when its trigger is focused" or "Theme: No token for a subtle warning background".

If you work on a product built on the design system, your team may have its own process for reporting upstream. Follow it as well.

A useful report includes:

-   **Context:** what you were building, and for whom.
-   **Expected and actual behavior:** what you needed the design system to do, and what it did instead.
-   **Where:** the package, component, or token, and the version of the Gutenberg plugin, npm package, or WordPress you used.
-   **What you tried:** the composition you attempted, and any workaround you settled on.
-   **A reproduction:** a minimal code snippet, a Storybook link with the controls set, or a screenshot or recording.
-   **A proposal, if you have one:** describe the problem first, so that the solution can be discussed on its own merits.

You'll likely not be able to set labels yourself, and you don't need to: triagers add them. For reference, these are the labels design system issues use:

| Label                          | Use for                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `Design System`                | Anything about how the system fits together as a whole.              |
| `[Package] UI`                 | Components in `@wordpress/ui`.                                       |
| `[Package] Components`         | Components in `@wordpress/components`.                               |
| `[Package] Theme`              | Design tokens and theming in `@wordpress/theme`.                     |
| `[Package] Icons`              | Icons in `@wordpress/icons`.                                         |
| `[Package] Design System MCP`  | The Design System MCP server.                                        |
| `[Focus] Accessibility (a11y)` | Anything that affects accessibility.                                 |
| `Needs Design`                 | Issues where the right solution needs design work before code.       |

## Fix it at the source

Anyone can propose a fix. How to start depends on what the fix changes:

-   **Small, contained fixes** can go straight to a pull request: a bug fix that doesn't change the public API, a documentation correction, or a missing story. Link the pull request to its issue, if there is one.
-   **Changes to the public contract** should start as an issue: a new component, prop, variant, or token, or a change in how something behaves. These are published APIs that plugins and other applications depend on, so agree on the direction before writing code.

Not every need belongs in the design system. If the discussion concludes that something is specific to one product, build it in that product on top of the public API. That isn't a workaround; it's how the design system is meant to be extended.

To get started:

1. Set up a local copy of Gutenberg with the [getting started guide](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/getting-started-with-code-contribution.md). Run this site locally with `npm run storybook:dev`.
2. Read the contribution guide for the package you're changing: [`@wordpress/ui`](https://github.com/WordPress/gutenberg/blob/trunk/packages/ui/CONTRIBUTING.md), [`@wordpress/components`](https://github.com/WordPress/gutenberg/blob/trunk/packages/components/CONTRIBUTING.md), [`@wordpress/theme`](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/README.md), or the [design tokens maintainer's guide](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/tokens/README.md).
3. Follow [Working with WordPress Design System packages](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/design/design-system-packages.md#change-a-package-safely) to check compatibility, tests, stories, documentation, and the changelog entry before you open the pull request.

Every page on this site is built from a source file in the repository. To find the one behind a page, use the "Open source file" button in the top toolbar. Corrections to them are welcome.

## If you're an AI agent

Everything above applies to you as well, with one difference: how to handle a shortcoming is the decision of the person you're working with, not yours.

-   **Stop and ask** when you meet a shortcoming, before working around it. Name the component, token, or page and what's missing. If a workaround is possible, say plainly that it isn't recommended and that it risks drifting from the design system as components change. Then let the person decide.
-   **Offer to draft the issue** or the fix, for the person to review and submit. The [WordPress AI guidelines](https://make.wordpress.org/ai/handbook/ai-guidelines/) make them responsible for what AI tools contribute, so don't file issues, comment, or open pull requests on the Gutenberg repository yourself.

In a Gutenberg checkout, the `design-system-contribution` skill in `.agents/skills/` covers changing a package.
