# Contributing

Thank you for taking the time to contribute.

The following is a set of guidelines for contributing to the `@wordpress/components` package to be considered in addition to the general ones described in our [Contributing Policy](/CONTRIBUTING.md).

This set of guidelines should apply especially to newly introduced components. In fact, while these guidelines should also be retroactively applied to existing components, it is sometimes impossible to do so for legacy/compatibility reasons.

-   [Introducing new components](#introducing-new-components)
-   [Compatibility](#compatibility)
-   [Compound components](#compound-components)
-   [Components & Hooks](#components--hooks)
-   [Naming Conventions](#naming-conventions)
-   [TypeScript](#typescript)
-   [Styling](#styling)
-   [Context system](#context-system)
-   [Unit tests](#unit-tests)
-   [Storybook](#storybook)
-   [Documentation](#documentation)
-   [README example](#README-example)
-   [Folder structure](#folder-structure)
-   [Component versioning](#component-versioning)

## Introducing new components

### Does it belong in the component library?

A component library should include components that are generic and flexible enough to work across a variety of products. It should include what’s shared across many products and omit what’s not.

To determine if a component should be added, ask yourself:

-   Could this component be used by other products/plugins?
-   Does the new component overlap (in functionality or visual design) with any existing components?
-   How much effort will be required to make and maintain?
-   Is there a clear purpose for the component?

Here’s a flowchart that can help determine if a new component is necessary:

[![New component flowchart](https://wordpress.org/gutenberg/files/2019/07/New_component_flowchart.png)](https://coggle.it/diagram/WtUSrld3uAYZHsn-/t/new-ui-component/992b38cbe685d897b4aec6d0dd93cc4b47c06e0d4484eeb0d7d9a47fb2c48d94)

### First steps

If you have a component you'd like added or changed, start by opening a GitHub issue. Include a detailed description in which you:

-   Explain the rationale
-   Detail the intended behavior
-   Clarify whether it’s a variation of an existing component, or a new asset
-   Include mockups of any fidelity (optional)
-   Include any inspirations from other products (optional)

This issue will be used to discuss the proposed changes and track progress. Reviewers start by discussing the proposal to determine if it's appropriate for WordPress Components, or if there's overlap with an existing component.

It’s encouraged to surface works-in-progress. If you’re not able to complete all of the parts yourself, someone in the community may be able to pick up where you left off.

### Next steps

Once the team has discussed and approved the change, it's time to start implementing it.

1. **Provide a rationale**: Explain how your component will add value to the system and the greater product ecosystem. Be sure to include any user experience and interaction descriptions.
2. **Draft documentation**: New components need development, design, and accessibility guidelines. Additionally, if your change adds additional behavior or expands a component’s features, those changes will need to be fully documented as well. Read through existing component documentation for examples. Start with a rough draft, and reviewers will help polish documentation.
3. **Provide working code**: The component or enhancement must be built in React. See the [developer contribution guidelines](https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/README.md).
4. **Create a design spec**: Create sizing and styling annotations for all aspects of the component. This spec should provide a developer with everything they need to create the design in code. [Figma automatically does this for you](https://help.figma.com/article/32-developer-handoff).

Remember, it’s unlikely that all parts will be done by one person. Contribute where you can, and others will help.

### Component refinement

Before a component is published it will need to be fine-tuned:

1. **Expand** the features of the component to a minimum. Agree on what features should be included.
2. **Reduce** scope and leave off features lacking consensus.
3. **Quality assurance**: each contribution must adhere to system standards.

#### Quality assurance

To ensure quality, each component should be tested. The testing process should be done during the development of the component and before the component is published.

-   **Accessibility**: Has the design and implementation accounted for accessibility? Please use the [WordPress accessibility guidelines](https://make.wordpress.org/accessibility/handbook/best-practices/). You must use the "Needs Accessibility Feedback" label and get a review from the accessibility team. It's best to request a review early (at the documentation stage) in order to ensure the component is designed inclusively from the outset.
-   **Visual quality**: Does the component apply visual style — color, typography, icons, space, borders, and more — using appropriate variables, and does it follow [visual guidelines](https://make.wordpress.org/design/handbook/design-guide/)? You must use the "Needs Design Feedback" label and get a review from the design team.
-   **Documentation**: Ensure that the component has proper documentation for development, design, and accessibility.
-   **Sufficient states & variations**: Does it cover all the necessary variations (primary, secondary, dense, etc.) and states (default, hover, active, disabled, loading, etc.), within the intended scope?
-   **Functionality**: Do all behaviors function as expected?
-   **Responsiveness**: Does it incorporate responsive behaviors as needed? Is the component designed from a mobile-first perspective? Do all touch interactions work as expected?
-   **Content resilience**: Is each dynamic word or image element resilient to too much, too little, and no content at all, respectively? How long can labels be, and what happens when you run out of space?
-   **Composability**: Does it fit well when placed next to or layered with other components to form a larger composition?
-   **Browser support**: Has the component visual quality and accuracy been checked across Safari, Chrome, Firefox, IE, etc? Please adhere to our [browser support requirements](https://github.com/WordPress/gutenberg/blob/HEAD/packages/browserslist-config/index.js).

## Compatibility

The `@wordpress/components` package includes components that are relied upon by many developers across different projects. It is, therefore, very important to avoid introducing breaking changes.

In these situations, one possible approach is to "soft-deprecate" a given legacy API. This is achieved by:

1. Removing traces of the API from the docs, while still supporting it in code.
2. Updating all places in Gutenberg that use that API.
3. Adding deprecation warnings (only after the previous point is completed, otherwise the Browser Console will be polluted by all those warnings and some e2e tests may fail).

When adding new components or new props to existing components, it's recommended to create a [private version](/packages/private-apis/README.md)) of the component until the changes are stable enough to be exposed as part of the public API.

### Learn more

-   [How to preserve backward compatibility for a React Component](/docs/contributors/code/backward-compatibility.md#how-to-preserve-backward-compatibility-for-a-react-component)
-   [Experimental and Unstable APIs](/docs/contributors/code/coding-guidelines.md#legacy-experimental-apis-plugin-only-apis-and-private-apis)
-   [Deprecating styles](#deprecating-styles)

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
	items={ [ { value: 'Item 1' }, { value: 'Item 2' }, { value: 'Item 3' } ] }
/>
```

```jsx
// ✅ Do:
<List>
	<List.Item value="Item 1" />
	<List.Item value="Item 2" />
	<List.Item value="Item 3" />
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
function useExampleComponent(
	props: PolymorphicComponentProps< ExampleProps, 'div' >
) {
	// Merge received props with the context system.
	const { isVisible, className, ...otherProps } = useContextSystem(
		props,
		'Example'
	);

	// Any other reusable rendering logic (e.g. computing className, state, event listeners...)
	const cx = useCx();
	const classes = useMemo(
		() => cx( styles.example, isVisible && styles.visible, className ),
		[ className, isVisible ]
	);

	return {
		...otherProps,
		className: classes,
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

-   the `Card` component, which builds on top of the `Surface` component by [calling the `useSurface` hook inside its own hook](/packages/components/src/card/card/hook.ts);
-   the `HStack` component, which builds on top of the `Flex` component and [calls the `useFlex` hook inside its own hook](/packages/components/src/h-stack/hook.tsx).

<!-- ## API Consinstency

[To be expanded] E.g.:

- Boolean component props should be prefixed with `is*` (e.g. `isChecked`), `has*` (e.g. `hasValue`) or `enable*` (e.g. `enableScroll`)
- Event callback props should be prefixed with `on*` (e.g. `onChanged`)
- Subcomponents naming conventions (e.g `CardBody` instead of `Card.Body`)
- ...

## Performance

TDB -->

## Naming Conventions

It is recommended for compound components to use dot notation to separate the namespace from the individual component names. The top-level compound component should be called as the namespace (no dot notation).

Dedicated React context should also use the dot notation, while hooks should not.

```tsx
// Component.tsx
//=======================
/** The top-level component's JSDoc. */
export const Component = Object.assign( TopLevelComponent, {
	/** The sub-component's JSDoc. */
	SubComponent,
	/** The sub-component's JSDoc. */
	Content,
} );

export function useComponent() {
	/* ... */
}

// App.tsx
//=======================
import { Component, useComponent } from '@wordpress/components';
import { useContext } from '@wordpress/element';

function CompoundComponentExample() {
	return (
		<Component>
			<Component.SubComponent />
		</Component>
	);
}

function ContextProviderExample() {
	return (
		<Component.Context.Provider value={ /* ... */ }>
			{ /* React tree */ }
		</Component.Context.Provider>
	);
}

function ContextConsumerExample() {
	const componentContext = useContext( Component.Context );

	// etc
}

function HookExample() {
	const hookReturnValue = useComponent();

	// etc.
}
```

## TypeScript

We strongly encourage using TypeScript for all new components.

Extend existing components’ props if possible, especially when a component internally forwards its props to another component in the package:

```ts
type NumberControlProps = Omit<
	InputControlProps,
	'isDragEnabled' | 'min' | 'max'
> & {
	/* Additional props specific to NumberControl */
};
```

Use JSDocs syntax for each TypeScript property that is part of the public API of a component. The docs used here should be aligned with the component’s README. Add `@default` values where appropriate:

```ts
/**
 * Renders with elevation styles (box shadow).
 *
 * @default false
 * @deprecated
 */
isElevated?: boolean;
```

Prefer `unknown` to `any`, and in general avoid it when possible.

If the component forwards its `...restProps` to an underlying element/component, you should use the `WordPressComponentProps` type for the component's props:

```ts
import type { WordPressComponentProps } from '../context';
import type { ComponentOwnProps } from './types';

function UnconnectedMyComponent(
	// The resulting type will include:
	// - all props defined in `ComponentOwnProps`
	// - all HTML props/attributes from the component specified as the second
	//   parameter (`div` in this example)
	// - the special `as` prop (which marks the component as polymorphic),
	//   unless the third parameter is `false`
	props: WordPressComponentProps< ComponentOwnProps, 'div', true >
) {
	/* ... */
}
```

### Considerations for the docgen

Make sure you have a **named** export for the component, not just the default export ([example](https://github.com/WordPress/gutenberg/blob/trunk/packages/components/src/divider/component.tsx)). This ensures that the docgen can properly extract the types data. The naming should be so that the connected/forwarded component has the plain component name (`MyComponent`), and the raw component is prefixed (`UnconnectedMyComponent` or `UnforwardedMyComponent`). This makes the component's `displayName` look nicer in React devtools and in the autogenerated Storybook code snippets.

```js
function UnconnectedMyComponent() {
	/* ... */
}

// 👇 Without this named export, the docgen will not work!
export const MyComponent = contextConnect(
	UnconnectedMyComponent,
	'MyComponent'
);
export default MyComponent;
```

On the component's main named export, add a JSDoc comment that includes the main description and the example code snippet from the README ([example](https://github.com/WordPress/gutenberg/blob/43d9c82922619c1d1ff6b454f86f75c3157d3de6/packages/components/src/date-time/date-time/index.tsx#L193-L217)). _At the time of writing, the `@example` JSDoc keyword is not recognized by StoryBook's docgen, so please avoid using it_.

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

function MyComponent( { __nextHasNoOuterMargins = false } ) {
	if ( ! __nextHasNoOuterMargins ) {
		deprecated( 'Outer margin styles for wp.components.MyComponent', {
			since: '6.0',
			version: '6.2', // Set a reasonable grace period depending on impact
			hint: 'Set the `__nextHasNoOuterMargins` prop to true to start opting into the new styles, which will become the default in a future version.',
		} );
	}
	return <Wrapper __nextHasNoOuterMargins={ __nextHasNoOuterMargins } />;
}
```

Styles should be structured so the deprecated styles are cleanly encapsulated, and can be easily removed when the deprecation version arrives.

```js
// styles.ts
const deprecatedMargins = ( { __nextHasNoOuterMargins } ) => {
	if ( ! __nextHasNoOuterMargins ) {
		return css`
			margin: 8px;
		`;
	}
};

export const Wrapper = styled.div`
	margin: 0;

	${ deprecatedMargins }
`;
```

Once deprecated, code examples in docs/stories should include the opt-in prop set to `true` so that new consumers are encouraged to adopt it from the start.

Remember to [add a **Needs Dev Note** label](/docs/contributors/code/backward-compatibility.md##dev-notes) to the pull request so third-party developers can be informed of the deprecation.

When the grace period is over and the deprecation version arrives, the `__next*` prop, deprecation notice, and deprecated styles should all be completely removed from the codebase.

#### Criteria for putting styles changes behind a feature flag

Not all style changes justify a formal deprecation process. The main thing to look for is whether the changes could cause layouts to break in an obvious or harmful way, given that the component is being used in a standard fashion.

##### DOES need formal deprecation

-   Removing an outer margin.
-   Substantial changes to width/height, such as adding or removing a size restriction.

##### DOES NOT need formal deprecation

-   Breakage only occurs in non-standard usage, such as when the consumer is overriding component internals.
-   Minor layout shifts of a few pixels.
-   Internal layout changes of a higher-level component.

## Context system

The `@wordpress/components` context system is based on [React's `Context` API](https://react.dev/reference/react/createContext), and is a way for components to adapt to the "context" they're being rendered in.

Components can use this system via a couple of functions:

-   they can provide values using a shared `ContextSystemProvider` component
-   they can connect to the Context via `contextConnect`
-   they can read the "computed" values from the context via `useContextSystem`

An example of how this is used can be found in the [`Card` component family](/packages/components/src/card). For example, this is how the `Card` component injects the `size` and `isBorderless` props down to its `CardBody` subcomponent — which makes it use the correct spacing and border settings "auto-magically".

```jsx
//=========================================================================
// Simplified snippet from `packages/components/src/card/card/hook.ts`
//=========================================================================
import { useContextSystem } from '../../context';

export function useCard( props ) {
	// Read any derived registered prop from the Context System in the `Card` namespace
	const derivedProps = useContextSystem( props, 'Card' );

	// [...]

	return computedHookProps;
}

//=========================================================================
// Simplified snippet from `packages/components/src/card/card/component.ts`
//=========================================================================
import { contextConnect, ContextSystemProvider } from '../../context';

function Card( props, forwardedRef ) {
	const { size, isBorderless, ...otherComputedHookProps } = useCard( props );

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
import { useContextSystem } from '../../context';

export function useCardBody( props ) {
	// Read any derived registered prop from the Context System in the `CardBody` namespace.
	// If a `CardBody` component is rendered as a child of a `Card` component, the value of
	// the `size` prop will be the one set by the parent `Card` component via the Context
	// System (unless the prop gets explicitely set on the `CardBody` component).
	const { size = 'medium', ...otherDerivedProps } = useContextSystem(
		props,
		'CardBody'
	);

	// [...]

	return computedHookProps;
}
```

## Unit tests

Please refer to the [JavaScript Testing Overview docs](/docs/contributors/code/testing-overview.md#snapshot-testing).

## Storybook

All new components should add stories to the project's [Storybook](https://storybook.js.org/). Each [story](https://storybook.js.org/docs/react/get-started/whats-a-story) captures the rendered state of a UI component in isolation. This greatly simplifies working on a given component, while also serving as an interactive form of documentation.

A component's story should be showcasing its different states — for example, the different variants of a `Button`:

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

## Component versioning

As the needs of the package evolve with time, sometimes we may opt to fully rewrite an existing component — either to introduce substantial changes, support new features, or swap the implementation details.

### Glossary

Here is some terminology that will be used in the upcoming sections:

-   "Legacy" component: the version(s) of the component that existsted on `trunk` before the rewrite;
-   API surface: the component's public APIs. It includes the list of components (and sub-components) exported from the package, their props, any associated React context. It does not include internal classnames and internal DOM structure of the components.

### Approaches

We identified two approaches to the task.

#### Swap the implementation, keep the same API surface

One possible approach is to keep the existing API surface and only swap the internal implementation of the component.

This is by far the simplest approach, since it doesn't involve making changes to the API surface.

If the existing API surface is not a good fit for the new implementation, or if it is not possible (or simply not desirable) to preserve backward compatibility with the existing implementation, there is another approach that can be used.

#### Create a new component (or component family)

This second approach involves creating a new, separate version (ie. export) of the component. Having two separate exports will help to keep the package tree-shakeable, and it will make it easier to potentially deprecated and remove the legacy component.

If possible, the legacy version of the component should be rewritten so that it uses the same underlying implementation of the new version, with an extra API "translation" layer to adapt the legacy API surface to the new API surface, e.g:

```
// legacy-component/index.tsx

function LegacyComponent( props ) {
	const newProps = useTranslateLegacyPropsToNewProps( props );

	return ( <NewComponentImplementation { ...newProps } /> );
}

// new-component/index.tsx
function NewComponent( props ) {
	return ( <NewComponentImplementation { ...props } /> );
}

// new-component/implementation.tsx
function NewComponentImplementation( props ) {
	// implementation
}

```

In case that is not possible (eg. too difficult to reconciliate new and legacy implementations, or impossible to preserve backward compatibility), then the legacy implementation can stay as-is.

In any case, extra attention should be payed to legacy component families made of two or more subcomponents. It is possible, in fact, that the a legacy subcomponent is used as a parent / child of a subcomponent from the new version (this can happen, for example, when Gutenberg allows third party developers to inject React components via Slot/Fill). To avoid incompatibility issues and unexpected behavior, there should be some code in the components warning when the above scenario happens — or even better, aliasing to the correct version of the component.

##### Naming

When it comes to naming the newly added component, there are two options.

If there is a good reason for it, pick a new name for the component. For example, some legacy components have names that don't correspond to the corrent name of UI widget that they implement (for example, `TabPanel` should be called `Tabs`, and `Modal` should be called `Dialog`).

Alternatively, version the component name. For example, the new version of `Component` could be called `ComponentV2`. This also applies for namespaced subcomponents (ie. `ComponentV2.SubComponent`).

### Methodology

Regardless of the chosen approach, we recommend adopting the following methodology:

1. First, make sure that the legacy component is well covered by automated tests. Using those tests against the new implementation will serve as a great first layer to make sure that we don't break backward compatibility where necessary, and that we are otherwise aware of any differences in behavior;
2. Create a new temporary folder, so that all the work can be done without affecting publicly exported APIs; make it explicit in the README, JSDocs and Storybook (by using badges) that the components are WIP and shouldn't be used outside of the components package;
3. Once the first iteration of the new component(s) is complete, start testing it by exporting it via private APIs, and replacing usages of the legacy component across the Gutenberg repository. This process is great to gather more feedback, spot bugs and missing features;
4. Once all usages are migrated, you can replace the legacy component with the new implementation, and delete the temporary folder and private exports. Don't forget to write a dev note when necessary.
