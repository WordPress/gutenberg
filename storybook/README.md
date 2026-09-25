# Storybook

Storybook is an open-source tool that provides a sandbox to develop and visualize components in isolation. See the [Storybook site](https://storybook.js.org/) for more information about the tool.

The Gutenberg project uses Storybook to view and work with the UI components developed in the WordPress packages.

View online at: https://wordpress.github.io/gutenberg/

Run locally in your development environment running: `npm run storybook:dev` from the top-level Gutenberg directory.

## Component status in the sidebar

Component pages declare their recommendation status with `parameters.componentStatus` (`recommended`, `use-with-caution`, `not-recommended` or `unaudited`). Parameters never reach the story index, so `status-indexer.ts` reads that value from the source at index time and tags every entry of the file with the status's `use-*` tag, listed next to its label and icon in `components/component-status-indicator/statuses.ts`. The sidebar shows the matching icon next to the component name, except for recommended, which is the default and has no icon. The tag filter next to the search box can include or exclude any status. Recommendation gets its own namespace because the `status-private` and `status-experimental` tags answer a different question, the API lifecycle and how a component can be imported, and are still declared by hand in each story's `tags` array. A component can carry one tag from each namespace, and since the tag filter sorts alphabetically, the shared `use-` prefix keeps the four statuses together below the `status-*` ones. All badge definitions live in `badges.js`, keyed by the tag that triggers them.

## Maintaining component recommendations

Recommendations apply to individual components, not entire packages. Check the component's status and notes when choosing between `@wordpress/ui` and `@wordpress/components`; an experimental API can still be recommended for its intended use.

### Set the component metadata

Use the **Open source file** button in Storybook to locate the component's `*.story.*` file. Add or update `componentStatus` inside the default export's `parameters`, preserving the other parameters. For example, this metadata marks a component as not yet audited:

```js
const meta = {
	// Keep the component's existing title, component, and other metadata.
	parameters: {
		componentStatus: {
			status: 'unaudited',
			whereUsed: 'global',
			notes: 'Not yet audited against the design system.',
		},
	},
};

export default meta;
```

Choose one of these exact `status` values:

| Status value       | Generated tag         | When to use it                                                                     |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------- |
| `recommended`      | `use-recommended`     | The component is a recommended choice for new UI.                                  |
| `use-with-caution` | `use-with-caution`    | The component has limitations; explain when it is appropriate in the notes.        |
| `not-recommended`  | `use-not-recommended` | The component should not be used for new UI; explain the alternative in the notes. |
| `unaudited`        | `use-unaudited`       | The component has not yet been audited against the design system.                  |

The `whereUsed` field is required by the Storybook parameter type: use `global` for general UI components or `editor` for components specific to the editing experience. It does not control the recommendation badge or create a filter tag.

The optional `notes` field accepts Markdown and appears alongside the status on the component's Docs page. For cautionary or negative recommendations, describe the limitation, the contexts it affects, and the recommended alternative or tracking issue. Link to the alternative's Docs page where one exists.

Keep `parameters`, `componentStatus`, and `status` as inline object properties with an inline string value for `status`, as in the example. The indexer reads the source syntax; it does not evaluate imported objects, variables, function calls, or spreads to find the status. Set the recommendation in the default metadata, rather than on an individual story, so it applies consistently to the file's stories and generated Docs entry.

Do not add `use-*` tags manually: the indexer generates them from `componentStatus.status`. Declare API lifecycle tags (`status-private`, `status-experimental`, or `status-wip`) separately in the default metadata's `tags` array when applicable. A recommendation does not override a private API restriction or make a work-in-progress component production-ready.

A missing status does not default to `unaudited`: it produces no recommendation badge or tag. Use `unaudited` explicitly when that is the intended status. This mechanism reads component story files; standalone MDX documentation pages do not automatically acquire a component's recommendation.

### Review and verify a recommendation change

Explain the reason for a recommendation change in the pull request and link to the relevant design review or issue so reviewers can assess it. Check whether the [`use-recommended-components` ESLint rule](/packages/eslint-plugin/docs/rules/use-recommended-components.md) also needs an update; changing Storybook metadata does not update the rule's maintained lists.

Run `npm run storybook:dev` from the repository root, then check:

1. The component's Docs page shows the intended status and notes, and links in the notes open the correct pages.
2. The sidebar icon and tooltip agree with the Docs page.
3. Selecting the corresponding `use-*` tag in the filter includes the component; excluding it removes the component.
4. Any existing API lifecycle badges remain visible alongside the recommendation.

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
