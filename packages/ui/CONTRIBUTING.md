# Contributing

The following guidance builds upon the existing [contribution guidelines for `@wordpress/components`](https://github.com/WordPress/gutenberg/blob/trunk/packages/components/CONTRIBUTING.md), which should serve as a starting point for contribution. The documentation included here encodes decisions and technical approaches which are unique to this package.

## Folder Structure

Each component should be organized within its own folder under `src/` following this pattern:

```text
src/
└── component-name/
    ├── index.ts            // Contains only exported public API
    ├── component-name.tsx  // Main component matching the folder name (when applicable)
    ├── other-component.tsx // Any other ancillary / compound components
    ├── types.ts            // TypeScript type definitions for all components in this folder
    ├── style.module.css    // Styles for all components in this folder
    ├── stories/
    │   ├── *.mdx           // Storybook documentation files (optional)
    │   └── index.story.tsx // Storybook stories for all components in this folder
    └── test/
        └── component-name.test.tsx // Tests for base component and all compound components
```

### Folder Structure Guidelines

-   The folder name should match the primary component name
-   The `index.ts` file should contain only the public API exports for the component(s)

## Public APIs

The package has a single entrypoint which exports all of the components of the package, and nothing else.

Specifically:

-   Components are implemented as [compound components](#compound-components). Exported components will define their own subcomponents as properties of the top-level export.
    -   Example: `import { Button } from '@wordpress/ui'; // Button, Button.Icon, etc.`
-   TypeScript types are not exported. If you need access to a component's prop types, use `React.ComponentProps`.
    -   Example: `type ButtonProps = React.ComponentProps< typeof Button >;`
-   Styles are defined in the built JavaScript files and are not loaded separately.

The package follows [semantic versioning](https://semver.org/), and the following are considered to be "the public API" for consideration of backwards-incompatible changes:

-   Component definitions (e.g. removing a component)
-   Component props (e.g. renaming, removing, or changing a props supported types such that existing usage would break in an update)
-   CSS properties prefixed with `--wp-ui-` (e.g. changing a CSS property such that it would negatively impact a user's experience)

## Compound Components

This package follows the [compound component approach outlined in the `@wordpress/components` contributing guidelines](https://github.com/WordPress/gutenberg/blob/trunk/packages/components/CONTRIBUTING.md#compound-components).

Some components will use a bare name (e.g. `Button`), while others will have a "root" component with modular children (e.g. `Tooltip.Root`). Use the base component name when it works standalone and any subcomponents are optional enhancements. Only introduce `.Root` when the component is modular and consumers are expected to compose multiple parts.

Why?

-   `.Root` primarily coordinates, and isn't useful on its own
    -   For example, a `Button` is useful on its own (renders an interactive element), unlike `Tabs.Root`
-   `.Root` has required subparts, signalling an expectation that it must be composed
    -   A non-root component can still have _optional_ sub-parts, like a `Button.Icon`

### When exporting with `Object.assign`

-   Add the primary component's JSDoc description to both the implementation export, and the public `Object.assign` wrapper. Storybook reads the implementation component's JSDoc for the component description, while IDEs can read the latter.
-   All subcomponents should set their `displayName` to the full public name before the `Object.assign` export:

```ts
ButtonIcon.displayName = 'Button.Icon';

/**
 * A versatile button component with multiple variants, tones, and sizes.
 */
export const Button = Object.assign( _Button, {
	/**
	 * An icon component specifically designed to work well when rendered inside
	 * a `Button` component.
	 */
	Icon: ButtonIcon,
} );
```

### In Storybook

-   Include public subcomponents in the component's Storybook `subcomponents` metadata, keying them as the full compound name in dot notation:

```ts
const meta: Meta< typeof Button > = {
	title: 'Design System/Components/Button',
	component: Button,
	subcomponents: {
		'Button.Icon': Button.Icon,
	},
};
```

## `render` Prop and Ref Forwarding

All `@wordpress/ui` components support a `render` prop (via the `ComponentProps` utility type) that lets consumers swap the underlying HTML element. This section codifies the two canonical implementation patterns, the rules for handling `render`, and common anti-patterns to avoid.

### Canonical Patterns

The correct approach depends on whether the component wraps a Base UI primitive or renders its own element.

#### Pattern A: Custom components — `useRender` + `mergeProps`

For components that do **not** wrap a Base UI primitive, use `useRender` and `mergeProps` from `@base-ui/react`. Destructure `render` from props (required by the `useRender` API), and pass it together with `ref` and merged props:

```tsx
import { useRender, mergeProps } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';

export const Root = forwardRef( function MyComponent( { render, className, ...restProps }, ref ) {
    const element = useRender( {
        render,
        defaultTagName: 'div',
        ref,
        props: mergeProps( { className: styles.root }, restProps ),
    } );

    return element;
} );
```

`useRender` handles element creation, ref composition, and prop merging.

#### Pattern B: Wrapper components — pass `ref` explicitly, spread `...props`

For components that wrap a Base UI primitive or another `@wordpress/ui` component, pass the forwarded `ref` explicitly and spread `...props` (which carries `render` through implicitly):

```tsx
import { Collapsible as _Collapsible } from '@base-ui/react/collapsible';
import { forwardRef } from '@wordpress/element';

export const Trigger = forwardRef( function MyTrigger( props, ref ) {
    return <_Collapsible.Trigger ref={ ref } { ...props } />;
} );
```

The inner component (Base UI or `@wordpress/ui`) handles `render` and ref composition internally.

### Explicit vs Implicit `render` Handling

**Prefer implicit handling (via `...props` rest spread) unless the component needs to interact with `render`.**

"Interact" means one of:

1. **Assign a default** — the component overrides the default element (e.g., `render = DEFAULT_TAG`).
2. **Transform** — the component wraps or modifies the value before passing it.
3. **Discard** — the component intentionally prevents element customization. In this case, destructure `render` to remove it from rest props, **and** `Omit` it from the type so consumers get a TypeScript error instead of silent no-op behavior.
4. **Pass to `useRender`** — Pattern A components where the hook API requires it as a named argument.

In all other cases, let `render` flow through `...props`. Destructuring `render` only to write `render={ render }` is ceremony with no behavioral effect.

### Overriding the Default Element

When a component needs to render a different element than its inner component's default (e.g., a `<div>` instead of `<span>`), hoist the default to a **module-level constant** and assign it as a destructuring default.

The default can be a **JSX element** or a **render function**, depending on what the component needs:

```tsx
// JSX element — suitable when you only need to swap the tag.
const DEFAULT_TAG = <div />;

export const Title = forwardRef( function MyTitle(
    { render = DEFAULT_TAG, className, children, ...props },
    ref
) {
    return (
        <Text ref={ ref } render={ render } className={ className } { ...props }>
            { children }
        </Text>
    );
} );
```

```tsx
// Render function — useful when the default needs to compose
// other components or add additional props.
const DEFAULT_RENDER = ( props: React.ComponentProps< typeof Stack > ) => (
    <Stack { ...props } direction="column" gap="sm" />
);

export const Root = forwardRef( function MyRoot(
    { className, render = DEFAULT_RENDER, ...restProps },
    ref
) {
    return (
        <_Field.Root ref={ ref } className={ className } render={ render } { ...restProps } />
    );
} );
```

When using a JSX element, React elements are immutable descriptors — `useRender` calls `cloneElement` on them (creating a new element), never mutating the original. In both cases, a hoisted constant avoids allocating a fresh object every render and gives React/Base UI a stable reference for equality checks.

### Anti-patterns

#### Bundling `ref` and `props` into a render fallback

```tsx
// BAD: ref and props are lost when consumer provides render
render={ render ?? <div ref={ ref } { ...props } /> }
```

When `render` is provided by the consumer, `ref` and `...props` remain on the unused fallback element and never reach the actual rendered element. Always pass `ref` and `...props` separately to the inner component.

#### Unnecessary explicit destructure

```tsx
// BAD: destructure-and-pass-through with no interaction
function MyComponent( { render, ...props }, ref ) {
    return <Inner ref={ ref } render={ render } { ...props } />;
}

// GOOD: let render flow through ...props
function MyComponent( props, ref ) {
    return <Inner ref={ ref } { ...props } />;
}
```

## Overlay Slot Props

Compound overlay primitives (`Tooltip`, `Popover`, `Select`, `Autocomplete`, etc.) expose their underlying Base UI subcomponents (`Portal`, `Positioner`, …) through **slot props** on `Popup` rather than as flat prop subsets. The corresponding subcomponents are exported alongside `Popup` (e.g. `Tooltip.Portal`, `Tooltip.Positioner`).

### Pattern

For each Base UI subcomponent that we want to expose to consumers:

1. Export a renderable wrapper subcomponent matching the Base UI subcomponent's name (e.g. `Tooltip.Positioner`).
2. Add an optional slot prop on `Popup` named after the subcomponent (e.g. `positioner`). The prop type accepts a React element of the matching subcomponent: `ReactElement< Omit< MySubcomponentProps, 'children' > >`.
3. When the slot prop is omitted, `Popup` uses the wrapper subcomponent with default props.
4. When the slot prop is provided, `Popup` clones the given element and injects the rest of the subtree as `children`. Use the `renderSlotWithChildren` helper to keep this consistent across overlays.

```tsx
<Tooltip.Popup
	portal={ <Tooltip.Portal container={ myContainer } /> }
	positioner={ <Tooltip.Positioner side="right" sideOffset={ 8 } /> }
>
	Save
</Tooltip.Popup>
```

### Why

-   One mental model across overlays — same prop names, same prop shape, regardless of which primitive is in use.
-   The wrapper subcomponents are also valid as standalone exports for advanced compositions.
-   `Popup` does not need to maintain a hand-picked `Pick<>` list of positioner/portal props. The full Base UI surface is reachable through the corresponding subcomponent.

### When to add a new slot prop

Only when there is a concrete consumer that needs to reach a Base UI subcomponent's customization. Do not preemptively expose slots.

High-level wrappers that hide `Popup` (for example `IconButton`, which renders a `Tooltip` internally) should re-expose the same slot props — same name, same shape — to keep the API uniform.

## CSS Architecture

### CSS Layers

We use [CSS cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers) to ensure an expected order of precedence in style resolution. All component stylesheets must follow this layering approach to maintain consistency and prevent specificity conflicts.

Every component stylesheet must include the layer definition in the top-level `wp-ui` layer and wrap all styles within the appropriate layer:

```css
@layer wp-ui {
	@layer utilities, components, compositions, overrides;

	@layer components {
		.stack {
			display: flex;
		}
	}
}
```

#### CSS Layer Hierarchy

All sub-layers are nested within the top-level `wp-ui` layer:

-   **`utilities`** - Shared utility styles (box-sizing, focus rings, resets) that apply before component styles
-   **`components`** - Default styles for design system components (`.stack`, etc.)
-   **`compositions`** - Internal compositions that extend base components
-   **`overrides`** - Last-resort styles to override default rules

A rule that overrides a primitive defined in another stylesheet (e.g. a shared class from `overlay-chrome.module.css`) must live in a **higher** layer than that primitive — typically `wp-ui-compositions`. Placing both in the same layer leaves the conflict to be resolved by `<style>` injection order, which is not deterministic and can flip when an unrelated component lazy-loads (its own copy of the shared stylesheet re-orders the tags). The layer hierarchy is what guarantees the override wins.

When the override also `composes` the primitive it extends, keep the override in `wp-ui.compositions` (the `composes` does not change its layer) and let `composes` bind the two classes together so the base can never be applied without the override:

```css
@layer wp-ui {
	/* ... */

	@layer compositions {
		.footer-column {
			composes: footer from '../utils/css/overlay-chrome.module.css';
			flex-direction: column;
		}
	}
}
```

### Custom Properties and State Styles

When components expose CSS custom properties (variables) for theming or composition, care must be taken to separate **configurable values** from **state handling**. Getting this wrong can silently break styles when components are composed across CSS layers.

#### The rule

> **Custom properties = configurable values. CSS properties = state machine.**

Define custom properties for each visual "slot" (default, active/hover, disabled, etc.) and assign them to design tokens or other values. In state selectors (`:hover`, `:active`, `:focus`, `[data-disabled]`, etc.), set **CSS properties** (like `background-color`, `color`) to reference the appropriate custom property for that state — do **not** reassign the custom property itself.

In CSS cascade layers, a rule in a higher-priority layer always wins over a lower-priority layer regardless of selector specificity. If a component reassigns a custom property inside a state selector, a higher layer that overrides that same custom property will win unconditionally — the state-based reassignment in the lower layer becomes dead code.

#### Do this

Define a separate custom property per state, and use CSS property declarations in state selectors:

```css
.button {
	--button-bg: blue;
	--button-bg-hover: darkblue;
	background-color: var(--button-bg);

	&:hover {
		background-color: var(--button-bg-hover);
	}
}
```

A composition in a higher layer can safely override both custom properties, and all states continue to work as expected.

#### Don't do this

Do not reassign the same custom property in state selectors:

```css
.button {
	--button-bg: blue;
	background-color: var(--button-bg);

	&:hover {
		--button-bg: darkblue;
	}
}
```

If a higher layer sets `.special-button { --button-bg: red; }`, that override wins over the hover reassignment (layer precedence trumps specificity). The hover state will show `red` instead of `darkblue`, and there is no way for the lower layer to recover.

### Disabled State Styling

For components built on Base UI, use the `data-disabled` attribute when styling disabled states rather than targeting `disabled` or `aria-disabled` directly. Base UI applies `data-disabled` consistently regardless of whether the underlying implementation uses the native `disabled` attribute or `aria-disabled` (which depends on the `focusableWhenDisabled` prop). This keeps styles decoupled from the specific HTML attribute and avoids verbose selectors that would need to target both.

### Global CSS defense (wp-admin)

WordPress loads broad, **unlayered** global styles in the admin (`common.css`, `forms.css`) that target bare elements (`input`, `button`, `a`, `p`, headings, and so on). In the cascade, **unlayered rules always win over layered rules**, no matter how specific the layered selector is. That means normal `@wordpress/ui` styles, which live in `@layer wp-ui-*`, can be overridden by admin CSS and components may look wrong in wp-admin (borders, focus rings, typography, colors, and more).

**What it is:** [`global-css-defense.module.css`](src/utils/css/global-css-defense.module.css) is a shared, **unlayered** stylesheet that defines small, class-scoped rules (for example `.input`, `.textarea`, `.button`, `.a`, `p.p`, `:is(h1,…,h6).heading`, `.div`). Those classes are applied on the actual DOM nodes that need protection. Because the declarations are unlayered and use classes, they compete with admin styles on similar footing and can win by specificity.

**How it works (custom property bridge):** Each defended property is expressed with an internal custom property and a fallback, for example:

```css
.input {
	font-size: var( --_gcd-input-font-size, inherit );
}
```

-   The **fallback** encodes the default that `@wordpress/ui` wants when nothing else is set, so many components need no extra declarations.
-   A component’s **layered** module can set `--_gcd-*` on a wrapper or the element itself. Custom property resolution is not blocked by cascade layers the same way longhand properties are, so the layered stylesheet can still supply the real token values while the unlayered rule applies them in a context where admin CSS would otherwise win.

Use the `--_gcd-*` prefix only inside this package; treat these variables as implementation details, not public theming API.

**When to use it:** Whenever you introduce or change a primitive that renders a native element commonly styled by wp-admin globals, wire in the matching defense class from `global-css-defense.module.css` (see existing usages in `Button`, `Input`, `Textarea`, `Link`, `Text`, field descriptions, and related form primitives). If admin styles affect a new element type, extend the defense module with a new class and the same bridge pattern rather than duplicating unlayered overrides inside individual components.

**Testing:** In Storybook, enable **WordPress global CSS** from the toolbar and compare stories with that mode on and off; appearance should match aside from intentional differences.

Long term, Core may reduce the need for this by [scoping](https://core.trac.wordpress.org/ticket/64939). Until then, this module is the supported way to keep components predictable inside wp-admin.
