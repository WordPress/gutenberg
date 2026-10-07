# Storybook

Storybook is an open-source tool that provides a sandbox to develop and visualize components in isolation. See the [Storybook site](https://storybook.js.org/) for more information about the tool.

The Gutenberg project uses Storybook to view and work with the UI components developed in the WordPress packages.

View online at: https://wordpress.github.io/gutenberg/

Run locally in your development environment running: `npm run storybook:dev` from the top-level Gutenberg directory.

## Component status in the sidebar

Component pages declare their recommendation status with `parameters.componentStatus` (`recommended`, `use-with-caution`, `not-recommended` or `unaudited`). Parameters never reach the story index, so `status-indexer.ts` reads that value from the source at index time and tags every entry of the file with the status's `use-*` tag, listed next to its label and icon in `components/component-status-indicator/statuses.ts`. The sidebar shows the matching icon next to the component name, except for recommended, which is the default and has no icon. The tag filter next to the search box can include or exclude any status. Recommendation gets its own namespace because the `status-private` and `status-experimental` tags answer a different question, the API lifecycle and how a component can be imported, and are still declared by hand in each story's `tags` array. A component can carry one tag from each namespace, and since the tag filter sorts alphabetically, the shared `use-` prefix keeps the four statuses together below the `status-*` ones. All badge definitions live in `badges.js`, keyed by the tag that triggers them.

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

## Stable story URLs

A story's URL is built from its `id`. Without one, Storybook derives the `id` from the `title`, so moving a story to another sidebar folder changes its URL and breaks existing links. Every story and doc therefore declares an `id`, and the `title` only sets its place in the sidebar:

```ts
const meta = {
	title: 'Components/Containers/Card', // Sidebar position, free to change.
	id: 'components-card', // URL, never changes.
};
```

In MDX, set it on the `Meta` block: `<Meta title="Design System/Introduction" id="design-system-introduction" />`. An MDX doc attached to a CSF file with `of={ … }` inherits that file's `id` and needs none of its own.

For a new story, use the `id` Storybook would derive from the `title`: lowercase, with each run of other characters replaced by a hyphen (`Components/Containers/Card` becomes `components-containers-card`). Never change the `id` of an existing story.

Two checks enforce this:

-   `storybook/test/story-ids.test.ts` fails when a story or doc does not declare an `id`.
-   `storybook/story-ids.txt` lists every published story and doc URL. CI regenerates it and fails when a URL in the committed list has disappeared.

To update the list, run the following from the top-level Gutenberg directory and commit the result. No Storybook build is needed.

```bash
npm run storybook:story-id-snapshot
```

New URLs are added without complaint. If a URL disappears because a story moved, restore its original `id` instead. If the removal is intended, for example when a component's stories are deleted, commit the regenerated list in the same pull request so the removed URLs are visible in the diff. Documentation for a deprecated component should usually be marked deprecated rather than deleted, so its URL keeps working.
