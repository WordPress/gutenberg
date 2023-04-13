# Contributing

Thank you for taking the time to contribute.

The following is a set of guidelines for contributing to the `@wordpress/components` package to be considered in addition to the general ones described in our [Contributing Policy](/CONTRIBUTING.md).

This set of guidelines should apply especially to newly introduced components. In fact, while these guidelines should also be retroactively applied to existing components, it is sometimes impossible to do so for legacy/compatibility reasons.

For an example of a component that follows these requirements, take a look at [`ItemGroup`](/packages/components/src/item-group).

- [Compatibility](#compatibility)
- [Compound components](#compound-components)
- [Components & Hooks](#components--hooks)
- [TypeScript](#typescript)
- [Styling](#styling)
- [Context system](#context-system)
- [Unit tests](#unit-tests)
- [Storybook](#storybook)
- [Documentation](#documentation)
- [README example](#README-example)
- [Folder structure](#folder-structure)
- [TypeScript migration guide](#refactoring-a-component-to-typescript)

## Compatibility

The `@wordpress/components` package includes components that are relied upon by many developers across different projects. It is, therefore, very important to avoid introducing breaking changes.

In these situations, one possible approach is to "soft-deprecate" a given legacy API. This is achieved by:

1. Removing traces of the API from the docs, while still supporting it in code.
2. Updating all places in Gutenberg that use that API.
3. Adding deprecation warnings (only after the previous point is completed, otherwise the Browser Console will be polluted by all those warnings and some e2e tests may fail).

When adding new components or new props to existing components, it's recommended to prefix them with `__unstable` or `__experimental` until they're stable enough to be exposed as part of the public API.

### Learn more

- [How to preserve backward compatibility for a React Component](/docs/contributors/code/backward-compatibility.md#how-to-preserve-backward-compatibility-for-a-react-component)
- [Experimental and Unstable APIs](/docs/contributors/code/coding-guidelines.md#experimental-and-unstable-apis)
- [Deprecating styles](#deprecating-styles)

<!-- ## Polymorphic Components (i.e. the `as` prop)

The primary way to compose components is through the `as` prop. This prop can be used to change the underlying element used to render a component, e.g.:

```tsx
function LinkButton( { href, children } ) {
	return <Button variant="primary" as="a" href={href}>{ children }</Button>;
}
```
-->

## Compound components

When creating components that render a list of subcomponents, prefer to expose the API using the [Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks) technique over array props like `items` or `options`:

```jsx
// ❌ Don't:
<List
	items={ [
		{ value: 'Item 1' },
		{ value: 'Item 2' },
		{ value: 'Item 3' },
	] }
/>
```

```jsx
// ✅ Do:
<List>
	<ListItem value="Item 1" />
	<ListItem value="Item 2" />
	<ListItem value="Item 3" />
</List>
```

When implementing this pattern, avoid using `React.Children.map` and `React.cloneElement` to map through the children and augment them. Instead, use React Context to provide state to subcomponents and connect them:

```jsx
// ❌ Don't:
function List ( props ) {
	const [ state, setState ] = useState();
	return (
		<div { ...props }>
			{ Children.map( props.children, ( child ) => cloneElement( child, { state } ) ) ) }
		</div>
	);
}
```

```jsx
// ✅ Do:
const ListContext = createContext();

function List( props ) {
	const [ state, setState ] = useState();
	return (
		<ListContext.Provider value={ state }>
			<div { ...props } />
		</ListContext.Provider>
	);
}

function ListItem( props ) {
	const state = useContext( ListContext );
	...
}
```

<!-- ## (Semi-)Controlled components

TBD

## Layout "responsibilities"

TBD — Components' layout responsibilities and boundaries (i.e., a component should only affect the layout of its children, not its own) -->

## Components & Hooks

One way to enable reusability and composition is to extract a component's underlying logic into a hook (living in a separate `hook.ts` file). The actual component (usually defined in a `component.tsx` file) can then invoke the hook and use its output to render the required DOM elements. For example:

```tsx
// in `hook.ts`
function useExampleComponent( props: PolymorphicComponentProps< ExampleProps, 'div' > ) {
	// Merge received props with the context system.
	const { isVisible, className, ...otherProps } = useContextSystem( props, 'Example' );

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
	forwardedRef: React.ForwardedRef< any >
) {
	const exampleProps = useExampleComponent( props );

	return <View { ...spacerProps } ref={ forwardedRef } />;
}
```

A couple of good examples of how hooks are used for composition are:

- the `Card` component, which builds on top of the `Surface` component by [calling the `useSurface` hook inside its own hook](/packages/components/src/card/card/hook.ts);
- the `HStack` component, which builds on top of the `Flex` component and [calls the `useFlex` hook inside its own hook](/packages/components/src/h-stack/hook.tsx).

<!-- ## API Consinstency

[To be expanded] E.g.:

- Boolean component props should be prefixed with `is*` (e.g. `isChecked`), `has*` (e.g. `hasValue`) or `enable*` (e.g. `enableScroll`)
- Event callback props should be prefixed with `on*` (e.g. `onChanged`)
- Subcomponents naming conventions (e.g `CardBody` instead of `Card.Body`)
- ...

## Performance

TDB -->

## TypeScript

We strongly encourage using TypeScript for all new components. Components should be typed using the `WordPressComponent` type.

<!-- TODO: add to the previous paragraph once the composision section gets added to this document.
(more details about polymorphism can be found above in the "Components composition" section). -->

## Styling

All new component should be styled using [Emotion](https://emotion.sh/docs/introduction).

Note: Instead of using Emotion's standard `cx` function, the custom [`useCx` hook](/packages/components/src/utils/hooks/use-cx.ts) should be used instead.

### Deprecating styles

Changing the styles of a non-experimental component must be done with care. To prevent serious breakage in third-party usage, in some cases we may want a grace period before fully removing the old styles. This can be done by temporarily placing the new styles behind a feature flag prop prefixed by `__next`, accompanied by a `deprecate()` warning in the console. The feature flag should be opt-in (false by default), and have a reasonably descriptive name (**not** `__nextHasNewStyles`). A descriptive name allows for multiple deprecations to proceed in parallel, separated by concerns or by deprecation version.

```jsx
// component.tsx
import deprecated from '@wordpress/deprecated';
import { Wrapper } from './styles.ts';

function MyComponent({ __nextHasNoOuterMargins = false }) {
	if ( ! __nextHasNoOuterMargins ) {
		deprecated( 'Outer margin styles for wp.components.MyComponent', {
			since: '6.0',
			version: '6.2', // Set a reasonable grace period depending on impact
			hint:
				'Set the `__nextHasNoOuterMargins` prop to true to start opting into the new styles, which will become the default in a future version.',
		} );
	}
	return <Wrapper __nextHasNoOuterMargins={__nextHasNoOuterMargins} />
}
```

Styles should be structured so the deprecated styles are cleanly encapsulated, and can be easily removed when the deprecation version arrives.

```js
// styles.ts
const deprecatedMargins = ({ __nextHasNoOuterMargins }) => {
	if ( ! __nextHasNoOuterMargins ) {
		return css`
			margin: 8px;
		`;
	}
};

export const Wrapper = styled.div`
	margin: 0;

	${deprecatedMargins}
`;
```

Once deprecated, code examples in docs/stories should include the opt-in prop set to `true` so that new consumers are encouraged to adopt it from the start.

Remember to [add a **Needs Dev Note** label](/docs/contributors/code/backward-compatibility.md##dev-notes) to the pull request so third-party developers can be informed of the deprecation.

When the grace period is over and the deprecation version arrives, the `__next*` prop, deprecation notice, and deprecated styles should all be completely removed from the codebase.

#### Criteria for putting styles changes behind a feature flag

Not all style changes justify a formal deprecation process. The main thing to look for is whether the changes could cause layouts to break in an obvious or harmful way, given that the component is being used in a standard fashion.

##### DOES need formal deprecation

- Removing an outer margin.
- Substantial changes to width/height, such as adding or removing a size restriction.

##### DOES NOT need formal deprecation

- Breakage only occurs in non-standard usage, such as when the consumer is overriding component internals.
- Minor layout shifts of a few pixels.
- Internal layout changes of a higher-level component.

## Context system

The `@wordpress/components` context system is based on [React's `Context` API](https://reactjs.org/docs/context.html), and is a way for components to adapt to the "context" they're being rendered in.

Components can use this system via a couple of functions:

- they can provide values using a shared `ContextSystemProvider` component
- they can connect to the Context via `contextConnect`
- they can read the "computed" values from the context via `useContextSystem`

An example of how this is used can be found in the [`Card` component family](/packages/components/src/card). For example, this is how the `Card` component injects the `size` and `isBorderless` props down to its `CardBody` subcomponent — which makes it use the correct spacing and border settings "auto-magically".

```jsx
//=========================================================================
// Simplified snippet from `packages/components/src/card/card/hook.ts`
//=========================================================================
import { useContextSystem } from '../../ui/context';

export function useCard( props ) {
	// Read any derived registered prop from the Context System in the `Card` namespace
	const derivedProps = useContextSystem( props, 'Card' );

	// [...]

	return computedHookProps;
}

//=========================================================================
// Simplified snippet from `packages/components/src/card/card/component.ts`
//=========================================================================
import { contextConnect, ContextSystemProvider } from '../../ui/context';

function Card( props, forwardedRef ) {
	const {
		size,
		isBorderless,
		...otherComputedHookProps
	} = useCard( props );

	// [...]

	// Prepare the additional props that should be passed to subcomponents via the Context System.
	const contextProviderValue = useMemo( () => {
		return {
			// Each key in this object should match a component's registered namespace.
			CardBody: {
				size,
				isBorderless,
			},
		};
	}, [ isBorderless, size ] );

	return (
		/* Write additional values to the Context System */
		<ContextSystemProvider value={ contextProviderValue }>
			{ /* [...] */ }
		</ContextSystemProvider>
	);
}

// Connect to the Context System under the `Card` namespace
const ConnectedCard = contextConnect( Card, 'Card' );
export default ConnectedCard;

//=========================================================================
// Simplified snippet from `packages/components/src/card/card-body/hook.ts`
//=========================================================================
import { useContextSystem } from '../../ui/context';

export function useCardBody( props ) {
	// Read any derived registered prop from the Context System in the `CardBody` namespace.
	// If a `CardBody` component is rendered as a child of a `Card` component, the value of
	// the `size` prop will be the one set by the parent `Card` component via the Context
	// System (unless the prop gets explicitely set on the `CardBody` component).
	const { size = 'medium', ...otherDerivedProps } = useContextSystem( props, 'CardBody' );

	// [...]

	return computedHookProps;
}
```

## Unit tests

Please refer to the [JavaScript Testing Overview docs](/docs/contributors/code/testing-overview.md#snapshot-testing).

## Storybook

All new components should add stories to the project's [Storybook](https://storybook.js.org/). Each [story](https://storybook.js.org/docs/react/get-started/whats-a-story) captures the rendered state of a UI component in isolation. This greatly simplifies working on a given component, while also serving as an interactive form of documentation.

A component's story should be showcasing its different states — for example, the different variants of a  `Button`:

```jsx
import Button from '../';

export default { title: 'Components/Button', component: Button };

const Template = ( args ) => <Button { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	text: 'Default Button',
	isBusy: false,
	isSmall: false,
};

export const Primary = Template.bind( {} );
Primary.args = {
	...Default.args,
	text: 'Primary Button',
	variant: 'primary',
};
```

A great tool to use when writing stories is the [Storybook Controls addon](https://storybook.js.org/addons/@storybook/addon-controls). Ideally props should be exposed by using this addon, which provides a graphical UI to interact dynamically with the component without needing to write code. Historically, we used [Knobs](https://storybook.js.org/addons/@storybook/addon-knobs), but it was deprecated and later removed in [#47152](https://github.com/WordPress/gutenberg/pull/47152).

The default value of each control should coincide with the default value of the props (i.e. it should be `undefined` if a prop is not required). A story should, therefore, also explicitly show how values from the Context System are applied to (sub)components. A good example of how this may look like is the [`Card` story](https://wordpress.github.io/gutenberg/?path=/story/components-card--default) (code [here](/packages/components/src/card/stories/index.tsx)).

Storybook can be started on a local machine by running `npm run storybook:dev`. Alternatively, the components' catalogue (up to date with the latest code on `trunk`) can be found at [wordpress.github.io/gutenberg/](https://wordpress.github.io/gutenberg/).

## Documentation

All components, in addition to being typed, should be using JSDoc when necessary — as explained in the [Coding Guidelines](/docs/contributors/code/coding-guidelines.md#javascript-documentation-using-jsdoc).

Each component that is exported from the `@wordpress/components` package should include a `README.md` file, explaining how to use the component, showing examples, and documenting all the props.

## README example

````markdown
# `ComponentName`

<!-- If component is experimental, add the following section: -->
<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

<!-- If component is deprecated, add the following section: -->
<div class="callout callout-alert">
This component is deprecated. Please use `{other component}` from the `{other package}` package instead.
</div>

Description of the component.

## Usage

Code example using correct markdown syntax and formatted using project's formatting rules. See [ItemGroup](/packages/components/src/item-group/item-group/README.md#usage) for a real-world example.

```jsx
import { ExampleComponent } from '@wordpress/components';

function Example() {
	return (
		<ExampleComponent>
			<p>Code is poetry</p>
		</ExampleComponent>
	);
}
```

## Props

The component accepts the following props:

### `propName`: Typescript style type i.e `string`, `number`, `( nextValue: string ) => void`

Prop description. With a new line before and after the description and before and after type/required blocks.

-   Required: Either `Yes` or `No`
<!-- If the prop has a default value, add the following line: -->
-   Default: [default value]

### Inherited props

Add this section when there are props that are drilled down into an internal component. See [ClipboardButton](/packages/components/src/clipboard-button/README.md) for an example.

<!-- Only add the next section if the component relies on the [Context System](#context-system) -->
## Context

See examples for this section for the [ItemGroup](/packages/components/src/item-group/item-group/README.md#context) and [`Card`](/packages/components/src/card/card/README.md#context) components.
````

## Folder structure

As a result of the above guidelines, all new components (except for shared utilities) should _generally_ follow this folder structure:

```text
component-name/
├── stories
│   └── index.js
├── test
│   └── index.js
├── component.tsx
├── context.ts
├── hook.ts
├── index.ts
├── README.md
├── styles.ts
└── types.ts
```

In case of a family of components (e.g. `Card` and `CardBody`, `CardFooter`, `CardHeader` ...), each component's implementation should live in a separate subfolder, while code common to the whole family of components (e.g types, utils, context...) should live in the family of components root folder:

```text
component-family-name/
├── sub-component-name/
│   ├── index.ts
│   ├── component.tsx
│   ├── hook.ts
│   ├── README.md
│   └── styles.ts
├── sub-component-name/
│   ├── index.ts
│   ├── component.tsx
│   ├── hook.ts
│   ├── README.md
│   └── styles.ts
├── stories
│   └── index.js
├── test
│   └── index.js
├── context.ts
├── index.ts
├── types.ts
└── utils.ts
```

## Refactoring a component to TypeScript

*Note: This section assumes that the local developer environment is set up correctly, including TypeScript linting. We also strongly recommend using an IDE that supports TypeScript.*

Given a component folder (e.g. `packages/components/src/unit-control`):

1. Remove the folder from the exclude list in `tsconfig.json`, if it isn’t already.
2. Remove any `// @ts-nocheck` comments in the folder, if any.
3. Rename `*.js{x}` files to `*.ts{x}` (except stories and unit tests).
4. Run `npm run dev` and take note of all the errors (your IDE should also flag them).
5. Since we want to focus on one component’s folder at the time, if any errors are coming from files outside of the folder that is being refactored, there are two potential approaches:
	1. Following those same guidelines, refactor those dependencies first.
		1. Ideally, start from the “leaf” of the dependency tree and slowly work your way up the chain.
		2. Resume work on this component once all dependencies have been refactored.
	2. Alternatively:
		1. For each of those files, add `// @ts-nocheck` at the start of the file.
		2. If the components in the ignored files are destructuring props directly from the function's arguments, move the props destructuring to the function's body (this is to avoid TypeScript errors from trying to infer the props type):

			```jsx
			// Before:
			function MyComponent( { myProp1, myProp2, ...restProps } ) { /* ... */ }

			// After:
			function MyComponent( props ) {
				const {  myProp1, myProp2, ...restProps } = props;

				/* ... */
			}
			```

		3. Remove the folders from the exclude list in the `tsconfig.json` file.
		4. If you’re still getting errors about a component’s props, the easiest way is to slightly refactor this component and perform the props destructuring inside the component’s body (as opposed as in the function signature) — this is to prevent TypeScript from inferring the types of these props.
		5. Continue with the refactor of the current component (and take care of the refactor of the dependent components at a later stage).
6. Create a new `types.ts` file.
7. Slowly work your way through fixing the TypeScript errors in the folder:
	1. Try to avoid introducing any runtime changes, if possible. The aim of this refactor is to simply rewrite the component to TypeScript.
	2. Extract props to `types.ts`, and use them to type components. The README can be of help when determining a prop’s type.
	3. Use existing HTML types when possible? (e.g. `required` for an input field?)
	4. Use the `CSSProperties` type where it makes sense.
	5. Extend existing components’ props if possible, especially when a component internally forwards its props to another component in the package.
	6. If the component forwards its `...restProps` to an underlying element/component, you should use the `WordPressComponentProps` type for the component's props:

		```tsx
		import type { WordPressComponentProps } from '../ui/context';
		import type { ComponentOwnProps } from './types';

		function UnconnectedMyComponent(
			// The resulting type will include:
			// - all props defined in `ComponentOwnProps`
			// - all HTML props/attributes from the component specified as the second
			//   parameter (`div` in this example)
			// - the special `as` prop (which marks the component as polymorphic),
			//   unless the third parameter is `false`
			props:  WordPressComponentProps< ComponentOwnProps, 'div', true >
		) { /* ... */ }
		```

	7. As shown in the previous examples, make sure you have a **named** export for the component, not just the default export ([example](https://github.com/WordPress/gutenberg/blob/trunk/packages/components/src/divider/component.tsx)). This ensures that the docgen can properly extract the types data. The naming should be so that the connected/forwarded component has the plain component name (`MyComponent`), and the raw component is prefixed (`UnconnectedMyComponent` or `UnforwardedMyComponent`). This makes the component's `displayName` look nicer in React devtools and in the autogenerated Storybook code snippets.

		```jsx
		function UnconnectedMyComponent() { /* ... */ }

		// 👇 Without this named export, the docgen will not work!
		export const MyComponent = contextConnect( UnconnectedMyComponent, 'MyComponent' );
		export default MyComponent;
		```

	8. Use JSDocs syntax for each TypeScript property that is part of the public API of a component. The docs used here should be aligned with the component’s README. Add `@default` values where appropriate.
	9. Prefer `unknown` to `any`, and in general avoid it when possible.
8. On the component's main named export, add a JSDoc comment that includes the main description and the example code snippet from the README ([example](https://github.com/WordPress/gutenberg/blob/43d9c82922619c1d1ff6b454f86f75c3157d3de6/packages/components/src/date-time/date-time/index.tsx#L193-L217)). _At the time of writing, the `@example` JSDoc keyword is not recognized by StoryBook's docgen, so please avoid using it_.
9. Make sure that:
	1. tests still pass;
	2. storybook examples work as expected.
	3. the component still works as expected in its usage in Gutenberg;
	4. the JSDocs comments on `types.ts` and README docs are aligned.
10. Convert Storybook examples to TypeScript (and from knobs to controls, if necessary) ([example](https://github.com/WordPress/gutenberg/pull/39320)).
	1. Update all consumers of the component to potentially extend the newly added types (e.g. make `UnitControl` props extend `NumberControl` props after `NumberControl` types are made available).
	2. Rename Story extension from `.js` to `.tsx`.
	3. Rewrite the `meta` story object, and export it as default. In particular, make sure you add the following settings under the `parameters` key:

		```tsx
		const meta: ComponentMeta< typeof MyComponent > = {
			parameters: {
				controls: { expanded: true },
				docs: { source: { state: 'open' } },
			},
		};
		```

		These options will display prop descriptions in the `Canvas ▸ Controls` tab, and expand code snippets in the `Docs` tab.

	4. Go to the component in Storybook and check the props table in the Docs tab. If there are props that shouldn't be there, check that your types are correct, or consider `Omit`-ing props that shouldn't be exposed.
		1. Use the `parameters.controls.exclude` property on the `meta` object to hide props from the docs.
		2. Use the `argTypes` prop on the `meta` object to customize how each prop in the docs can be interactively controlled by the user (tip: use `control: { type: null }` to remove the interactive controls from a prop, without hiding the prop from the docs).
		3. See the [official docs](https://storybook.js.org/docs/react/essentials/controls) for more details.
	5. Comment out all existing stories.
	6. Create a default template, where the component is being used in the most “vanilla” way possible.
	7. Use the template for the `Default` story, which will serve as an interactive doc playground.
	8. Add more focused stories as you see fit. These non-default stories should illustrate specific scenarios and usages of the component. A developer looking at the Docs tab should be able to understand what each story is demonstrating. Add JSDoc comments to stories when necessary.
11. Convert unit tests.
	1. Rename test file extensions from `.js` to `.tsx`.
	2. Fix all TypeScript errors.
