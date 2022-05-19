# Customize Widgets

Widgets blocks in Customizer Module for WordPress.

> This package is meant to be used only with WordPress core. Feel free to use it in your own project but please keep in mind that it might never get fully documented.

## Installation

Install the module

```bash
npm install @wordpress/customize-widgets
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Technical implementation details

The new Widgets Customizer replaces `Appearance > Customize > Widgets` with block-based editors. The original Customizer is a Backbone app, but the new editor is a React app. One of the challenges is to integrate them together but make sure features from both sides still work.

We extend the Customizer's sections and controls in the `/controls` directory and inject some custom logic for the editor. We use React portal to render each editor in its section to reuse most of the styles and scripts provided by the Customizer.

`components/sidebar-block-editor` is the entry point for each widget area's block editor. `component/sidebar-block-editor/sidebar-adapter.js` is an adapter to talk to [the Customize API](https://developer.wordpress.org/themes/customize-api/) and transform widget objects into widget instances.

`components/sidebar-block-editor/use-sidebar-block-editor.js` is a custom React Hook to integrate the adapter into React and handle most of the translations between blocks and widgets. These allow us to implement basic editing features as well as real-time preview in a backwards-compatible way.

Whenever the blocks change, we run through each block to determine if there are created, edited, or deleted blocks. We then convert them to their widget counterparts and call the Customize API to update them.

For React developers, this can be thought of as a custom reconciler or a custom renderer for the Customizer. But instead of targeting DOM as the render target, we are targeting WordPress widgets using the Customize API.

This is not the typical way the block editor is intended to be used. As a result, we have to also implement some missing features such as undo/redo and custom focus control. It is still a goal to make the block editor as easy to integrate into different systems as possible, so the integration in the Widgets Customizer can be a good experience for us to reflect some drawbacks in our current API and potentially improve them in the future.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
