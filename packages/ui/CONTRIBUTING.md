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
const defaultRender = ( props: React.ComponentProps< typeof Stack > ) => (
    <Stack { ...props } direction="column" gap="sm" />
);

export const Root = forwardRef( function MyRoot(
    { className, render = defaultRender, ...restProps },
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

## CSS Architecture

### CSS Layers

We use [CSS cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers) to ensure an expected order of precedence in style resolution. All component stylesheets must follow this layering approach to maintain consistency and prevent specificity conflicts.

Every component stylesheet must include the layer definition at the top and wrap all styles within the appropriate layer:

```css
@layer wp-ui-utilities, wp-ui-components, wp-ui-compositions, wp-ui-overrides;

@layer wp-ui-components {
	.stack {
		display: flex;
	}
}
```

#### CSS Layer Hierarchy

-   **`wp-ui-utilities`** - Shared utility styles (box-sizing, focus rings, resets) that apply before component styles
-   **`wp-ui-components`** - Default styles for design system components (`.stack`, etc.)
-   **`wp-ui-compositions`** - Internal compositions that extend base components
-   **`wp-ui-overrides`** - Last-resort styles to override default rules

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
