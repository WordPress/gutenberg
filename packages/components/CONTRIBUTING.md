# Contributing

Thank you for taking the time to contribute.

The following is a set of guidelines for contributing to the `@wordpress/components` package to be considered in addition to the general ones described in our [Contributing Policy](/CONTRIBUTING.md).

## Core principles

Contributions to the `@wordpress/components` package should follow a set of core principles and technical requirements.

This set of guidelines should apply especially to newly introduced components. It is, in fact, possible that some of the older component don't respect some of these guidelines for legacy/compat reasons.

### Compatibility

The `@wordpress/components` package includes several components which are relied upon by many developers across different projects. It is, therefore, very important to avoid introducing breaking changes as much as possible.

In these situations, an alternative approach is to "soft-deprecate" the given legacy API. This is achieved by removing traces of the API from the docs, while the code keeps supporing it in the background (with or without a warning)

### Components structure

The contents of the `@wordpress/components` package can be divided into three groups: UI Primitives, UI Blocks, and Utilities.

#### UI Primitives

Lower-level components, which are usually composed together to build the second type of components: UI Blocks. UI Primitives usually don't contain translated text and aim at being highly configurable (at the expense of exposing more props and therefore more complexity).

UI Primitives can be useful when in need of building an app with all new UI that looks and feels like WordPress but isn't powered by other WordPress technologies (like `@wordpress/i18n`).

_[Note: we need to discuss how to properly classify/label these components. Should we introduce `primitives`, `blocks` and `utils` folders in the `src` folder? Should we include a standard way in each component's README to show which category it belongs to?]_

#### UI Blocks

Higher-level components, which usually offer fewer props compared to UI Primitives and contain translated text. These components use other WordPress technologies and are ready to be used in Gutenberg's UI.

#### Utilities

Components and other utilities function that don't necessarily render a piece of UI to screen, but are instead useful when implementing a given piece of functionality.

### Components composition

[To be expanded] E.g.:

- Polymorphic Components
- Using `children` vs custom render props vs arbitrary "data" props
- Controlled and semi-controlled components
- Composition patterns
- Sub-components naming conventions
- Components' layout responsibilities and boundaries (i.e., a component should only affect the layout of its children, not its own)
- ...

### APIs Consinstency

[To be expanded] E.g.:

- Boolean component props should be prefixed with `is*` (e.g. `isChecked`), `has*` (e.g. `hasValue`) or `enable*` (e.g. `enableScroll`)
- Event callback props should be prefixed with `on*` (e.g. `onChanged`)
- ...

### Technical requirements for new components

The following are a set of technical requirements for all newly introduced components. These requirements are also retroactively being applied to existing components.

For an example of a component that follows these requirements, take a look at [`ItemGroup`](/packages/components/src/item-group);

#### TypeScript

We strongly encourage using TypeScript for all new components. Components should be typed using the `WordPressComponent` type (more details about polymorphism can be found above in the "Components composition" section).

#### Emotion

All new component should be styled using [Emotion](https://emotion.sh/docs/introduction).

Note: Instead of using Emotion's standard `cx` function, the custom [`useCx` hook](/packages/components/src/utils/hooks/use-cx.ts) should be used instead.

#### Context system

[To be expanded]

#### Hooks vs Components

[To be expanded]

#### Unit tests

All new components should include unit tests using [testing library](https://testing-library.com/). Ideally, the component's main piece of functionality would be tested explicitely (rather than using snapshots).

#### Storybook

All new components should include Storybook examples.

#### Documentation

All components, in addition to being typed, should be using JSDoc when necessary.

Each component that is exported from the `@wordpress/components` package should include a `README.md` file, explaining how to use the component, showing examples, and documenting all the props.

#### Folder structure

Following all previous guidelines, all new components should follow this folder structure:

```
component-parent-folder/
├── sub-component-folder/
├── component.tsx
├── context.ts
├── hook.ts
├── index.ts
├── README.md
├── styles.ts
└── types.ts
```

In case of a family of components (e.g. `Card` and `CardBody`, `CardFooter`, `CardHeader` ...), each component's implementation should be added in a separate subfolder:

```
component-parent-folder/
├── sub-component-folder/
│   ├── index.ts
│   ├── component.tsx
│   ├── hook.ts
│   ├── README.md
│   ├── styles.ts
│   └── types.ts
├── sub-component-folder/
│   ├── index.ts
│   ├── component.tsx
│   ├── hook.ts
│   ├── README.md
│   ├── styles.ts
│   └── types.ts
├── stories
│   └── index.js
├── test
│   └── index.js
├── context.ts
└── index.ts
```
