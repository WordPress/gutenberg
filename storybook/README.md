# Storybook

Storybook is an open-source tool that provides a sandbox to develop and visualize components in isolation. See the [Storybook site](https://storybook.js.org/) for more information about the tool.

The Gutenberg project uses Storybook to view and work with the UI components developed in the WordPress packages.

View online at: https://wordpress.github.io/gutenberg/

Run locally in your development environment running: `npm run storybook:dev` from the top-level Gutenberg directory.

`@wordpress/ui` Storybook entries include search synonyms (see `packages/ui/src/stories/component-synonyms.json`). The dev/build scripts patch Storybook's manager so sidebar search matches those terms.
