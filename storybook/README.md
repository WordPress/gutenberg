# Storybook

Storybook is an open-source tool that provides a sandbox to develop and visualize components in isolation. See the [Storybook site](https://storybook.js.org/) for more information about the tool.

The Gutenberg project uses Storybook to view and work with the UI components developed in the WordPress packages.

View online at: https://wordpress.github.io/gutenberg/

Run locally in your development environment running: `npm run storybook:dev` from the top-level Gutenberg directory.

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
