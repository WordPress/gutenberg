# Storybook

Storybook is an open-source tool that provides a sandbox to develop and visualize components in isolation. See the [Storybook site](https://storybook.js.org/) for more information about the tool.

The Gutenberg project uses Storybook to view and work with the UI components developed in the WordPress packages.

View online at: https://wordpress.github.io/gutenberg/

Run locally in your development environment running: `npm run storybook:dev` from the top-level Gutenberg directory.

## Component status in the sidebar

Component pages declare their recommendation status with `parameters.componentStatus` (`recommended`, `use-with-caution`, `not-recommended` or `unaudited`). Parameters never reach the story index, so `status-indexer.ts` reads that value from the source at index time and tags every entry of the file with the status's `use-*` tag, listed next to its label and icon in `components/component-status-indicator/statuses.ts`. The sidebar shows the matching icon next to the component name, except for recommended, which is the default and has no icon. The tag filter next to the search box can include or exclude any status. Recommendation gets its own namespace because the `status-private` and `status-experimental` tags answer a different question, the API lifecycle and how a component can be imported, and are still declared by hand in each story's `tags` array. A component can carry one tag from each namespace, and since the tag filter sorts alphabetically, the shared `use-` prefix keeps the four statuses together below the `status-*` ones. All badge definitions live in `badges.js`, keyed by the tag that triggers them.

## Manifests

The Storybook build publishes machine-readable manifests at `manifests/components.json` and `manifests/docs.json`, which the [design system MCP server](/packages/design-system-mcp/README.md) serves to AI agents. `preview.jsx` excludes every story and document from the manifests by default, so a story file or MDX document must opt in with the `manifest` tag. In an MDX document, add it to the `<Meta />` block, as in `<Meta title="Design System/Patterns/Example" tags={ [ 'manifest' ] } />`.

Standalone MDX documents are written to `docs.json`. Documents attached to a story file with `<Meta of={ … } />` are written to that file's entry in `components.json` instead. The MCP server serves every document under "Design System/Patterns" with its `get_patterns` and `get_pattern_details` tools, so a new pattern document must be standalone and tagged. The pattern list in the MCP server names each pattern with the last segment of its `<Meta />` title, and describes it with the document's lead paragraph, directly after the `#` heading. Write that paragraph so that it says what the pattern is for.

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
