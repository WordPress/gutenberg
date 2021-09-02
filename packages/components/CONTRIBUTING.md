# Contributing

Thank you for taking the time to contribute.

The following is a set of guidelines for contributing to the `@wordpress/components` package to be considered in addition to the general ones described in our [Contributing Policy](/CONTRIBUTING.md).

## Core principles

Contributions to the `@wordpress/components` package should follow a set of core principles and technical requirements.

This set of guidelines should apply especially to newly introduced components. It is, in fact, possible that some of the older component don't respect some of these guidelines for legacy/compat reasons.

### Compatibility

The `@wordpress/components` package includes components that are relied upon by many developers across different projects. It is, therefore, very important to avoid introducing breaking changes.

In these situations, one possible approach is to "soft-deprecate" a given legacy API. This is achieved by:

1. Removing traces of the API from the docs, while still supporing it in code;
2. Updating all places in Gutenberg that use that API;
3. Adding deprecation warnings (only after the previous point is completed, otherwide the Browser Console will be polluted by all those warnings and some e2e tests may fail).

### Components composition


### Polymorphic Components (i.e. the `as` prop)

The primary way to compose components is through the `as` prop. This prop can be used to change the underlying element used to render a component, e.g.:

```tsx
function LinkButton( { href, children } ) {
	return <Button variant="primary" as="a" href={href}>{ children }</Button>;
}
```

### Composition patterns

TBD — E.g. Using `children` vs custom render props vs arbitrary "data" props

### (Semi-)Controlled components

TBD

### Layout "responsibilities"

TBD — Components' layout responsibilities and boundaries (i.e., a component should only affect the layout of its children, not its own)

#### Components & Hooks

One way to enable reusability and composition is to extract a component's underlying logic into a hook (living in a separate `hook.ts` file). The actual component (usually defined in a `component.tsx` file) can then invoke the hook and use its output to render the required DOM elements. For example:

```tsx
// in `hook.ts`
function useExampleComponent( props: PolymorphicComponentProps< ExampleProps, 'div' > ) {
	// Merge received props with the context system.
	const { isVisible, className, ...otherProps	} = useContextSystem( props, 'Example' );

	// Any other reusable rendering logic (e.g. computing className, state, event listeners...)
	const cx = useCx();
	const classes = useMemo(
		() =>
			cx(
				styles.example,
				isVisible && styles.visible,
				className
			),
		[ className, isVisible ]
	);

	return {
		...otherProps,
		className: classes
	};
}

// in `component.tsx`
function Example(
	props: PolymorphicComponentProps< ExampleProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const exampleProps = useExampleComponent( props );

	return <View { ...spacerProps } ref={ forwardedRef } />;
}
```

A couple of good examples of how hooks are used for composition are:

- the `Card` component, which builds on top of the `Surface` component by [calling the `useSurface` hook inside its own hook](/packages/components/src/card/card/hook.js);
- the `HStack` component, which builds on top of the `Flex` component and [calls the `useFlex` hook inside its own hook](/packages/components/src/h-stack/hook.js).

### APIs Consinstency

[To be expanded] E.g.:

- Boolean component props should be prefixed with `is*` (e.g. `isChecked`), `has*` (e.g. `hasValue`) or `enable*` (e.g. `enableScroll`)
- Event callback props should be prefixed with `on*` (e.g. `onChanged`)
- Subcomponents naming conventions (e.g `CardBody` instead of `Card.Body`)
- ...

### Technical requirements for new components

The following are a set of technical requirements for all newly introduced components. These requirements are also retroactively being applied to existing components.

For an example of a component that follows these requirements, take a look at [`ItemGroup`](/packages/components/src/item-group) as an example.

#### TypeScript

We strongly encourage using TypeScript for all new components. Components should be typed using the `WordPressComponent` type (more details about polymorphism can be found above in the "Components composition" section).

#### Emotion

All new component should be styled using [Emotion](https://emotion.sh/docs/introduction).

Note: Instead of using Emotion's standard `cx` function, the custom [`useCx` hook](/packages/components/src/utils/hooks/use-cx.ts) should be used instead.

#### Context system

[To be expanded]

#### Unit tests

Please refer to the [JavaScript Testing Overview docs](/docs/contributors/code/testing-overview.md).

#### Storybook

All new components should include [Storybook](https://storybook.js.org/) stories, in order to make it easier to work on and review each component in isolation.

A component's stories should be showcasing its different states — for example, a `Button`'s different variants:

```jsx
import Button from '../';

export default { title: 'Components/Button', component: Button };

export const _default = () => <Button>Default Button</Button>;

export const primary = () => <Button variant="primary">Primary Button</Button>;

export const secondary = () => <Button variant="secondary">Secondary Button</Button>;
```

For even more flexibility while writing stories, the [`@storybook/addons-controls`](https://storybook.js.org/addons/@storybook/addon-controls) addon is a great way to interact with a component's arguments dynamically and in real time.

Ideally, all of the props for the story's components should be exposed by using knobs. The default value of the knobs should coincide with the default value of the props (i.e. it should be `undefined` if a prop is not required). A story should, therefore, also explicitely show how values from the Context System are applied to (sub)components. A good example of how this may look like is the [`Card` story](https://wordpress.github.io/gutenberg/?path=/story/components-card--default) (code [here](/packages/components/src/card/stories/index.js)).

Storybook can be started on a local maching by running `npm run storybook:dev`. Alternatively, the components' catalogue (up to date with the latest code on `trunk`) can be found at [wordpress.github.io/gutenberg/](https://wordpress.github.io/gutenberg/).

#### Documentation

All components, in addition to being typed, should be using JSDoc when necessary.

Each component that is exported from the `@wordpress/components` package should include a `README.md` file, explaining how to use the component, showing examples, and documenting all the props.

#### Folder structure

As a result of the above guidelines, all new components (except for shared utilities) should _generally_ follow this folder structure:

```
component-name/
├── component.tsx
├── context.ts
├── hook.ts
├── index.ts
├── README.md
├── styles.ts
└── types.ts
```

In case of a family of components (e.g. `Card` and `CardBody`, `CardFooter`, `CardHeader` ...), each component's implementation should live in a separate subfolder:

```
component-family-name/
├── sub-component-name/
│   ├── index.ts
│   ├── component.tsx
│   ├── hook.ts
│   ├── README.md
│   ├── styles.ts
│   └── types.ts
├── sub-component-name/
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
