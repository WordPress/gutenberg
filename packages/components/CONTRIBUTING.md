# Contributing

Thank you for taking the time to contribute.

The following is a set of guidelines for contributing to the `@wordpress/components` package to be considered in addition to the general ones described in our [Contributing Policy](/CONTRIBUTING.md).

## Core principles

- Mix of legacy and newer components
- Avoid breaking changes as much as possible
- Set of components mainly focused on building Gutenberg-specific UI (toolbars and sidebars)
- Primitive vs High-level vs Utility (https://github.com/WordPress/gutenberg/issues/33111)
- Composition and API consistency (https://github.com/WordPress/gutenberg/issues/33391) (e.g. boolean props begin with `is` or `has`, event callbacks begin with `on`, etc)
- Layout: Each component should worry only about the layout of its children (e.g. no margins around itself). Layout components separate from
- Styled components should be suffixed with "*View", to make it clear that they're styled components in other files

Note: didn't we say that we'd remove the `createComponent` function?

### Technical requirements for new components

- TypeScript (Polymorphic component props)
- Emotion
- Context system
- Unit tests
- Storybook
- Folder structure (sub-components folders with hook and component)
- Docs

## Examples

Each component needs to include an example in its README.md file to demonstrate the usage of the component.

These examples can be consumed automatically from other projects in order to visualize them in their documentation. To ensure these examples are extractable, compilable and renderable, they should be structured in the following way:

-   It has to be included in a `jsx` code block.
-   It has to work out-of-the-box. No additional code should be needed to have working the example.
-   It has to define a React component called `My<ComponentName>` which renders the example (i.e.: `MyButton`). Examples for the Higher Order Components should define a `MyComponent<ComponentName>` component (i.e.: `MyComponentWithNotices`).


## Pull Request Process

TBD
