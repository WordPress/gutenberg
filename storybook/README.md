# Storybook

Storybook is an open-source tool that provides a sandbox to develop and visualize components in isolation. See the [Storybook site](https://storybook.js.org/) for more information about the tool.

The Gutenberg project uses Storybook to view and work with the UI components developed in the WordPress packages.

View online at: https://wordpress.github.io/gutenberg/

Run locally in your development environment running: `npm run storybook:dev` from the top-level Gutenberg directory.

## Stable story URLs

Every story and doc declares an explicit `id`. The `id` is the story's URL; the `title` is only its position in the sidebar:

```
wordpress.github.io/gutenberg/?path=/docs/components-card--docs
                                          ^ the id
```

Without an `id`, Storybook derives one from the `title` on every build, so moving a story to another sidebar folder silently changes its URL and breaks every existing link to it. Declaring the `id` decouples the two: the sidebar can be reorganized freely, and published URLs stay put.

Set it next to the `title`, in CSF:

```ts
const meta: Meta< typeof Card > = {
	title: 'Components/Containers/Card', // Sidebar position, free to change.
	id: 'components-card', // URL, frozen.
};
```

And in MDX:

```mdx
<Meta
	title="Design System/Components/Introduction"
	id="design-system-components-introduction"
/>
```

For a new story, use the ID Storybook would have derived anyway: the lowercased `title` with each non-alphanumeric run replaced by a single hyphen (`Components/Containers/Card` becomes `components-containers-card`). For an existing one, never change the `id` — that is the link everyone already has.

An MDX doc attached to a CSF file with `of={ … }` inherits that file's `id` and declares nothing of its own.

Two checks keep this from eroding:

-   `storybook/test/story-ids.test.ts` fails when a story or doc is missing an `id`.
-   `storybook/story-ids.txt` is a committed list of every story and doc URL. CI regenerates it and fails when an ID it used to contain has disappeared, so losing a published URL has to be deliberate rather than a side effect of a rename. Regenerate it with `npm run storybook:story-id-snapshot` and commit the result. It reads the story index from source, so no Storybook build is needed.

Documentation for a deprecated component is meant to stay reachable, so the usual answer for an outdated page is to mark it deprecated and point at its replacement rather than delete it.

## Manifest snapshot regression testing

Storybook upgrades and inocuous code refactoring have been a frequent source of accidental documentation regressions, resulting in component or prop descriptions being accidentally removed.

To catch these, a consolidated snapshot of the components manifest is committed:

-   `storybook/components-manifest.yml` is a list of each component and its props.
-   `storybook/prop-description-allowlist.json` is a set of known components and props that are currently missing a description. The generator script fails on any new undocumented component or prop that isn't listed here, so this allowlist is expected to shrink over time.

Description text is not stored in the snapshot, since it is noisy to diff and increases the burden on developers. Instead, the snapshot reflects and enforces on presence rather than specific values.

When a snapshot changes due to code changes or Storybook upgrades, a pull request's checks will fail and expect the developer to commit the changes after acknowledging that they are expedcted:

```bash
npm run storybook:build
npm run storybook:manifest-snapshot
```
