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

-   Define custom properties for each visual "slot" (default, active/hover, disabled, etc.) and assign them to design tokens or other values.
-   In state selectors (`:hover`, `:active`, `:focus`, `[data-disabled]`, etc.), set **CSS properties** (like `background-color`, `color`, `border-color`) to reference the appropriate custom property for that state. Do **not** reassign the custom property itself.

#### Why this matters

In CSS cascade layers, a rule in a higher-priority layer **always** wins over a rule in a lower-priority layer, regardless of selector specificity. If a component reassigns a custom property inside a state selector, a higher layer that overrides that same custom property will take precedence unconditionally — the state-based reassignment in the lower layer is effectively dead code.

By keeping state handling in CSS property declarations and using custom properties only as configurable inputs, higher layers can safely override the custom property values without interfering with how states resolve.

#### Example: the correct pattern

The `Button` component demonstrates this approach. It defines a set of custom properties for each visual state:

```css
.button {
	/* Configurable values — one custom property per visual state */
	--wp-ui-button-background-color: var(--wpds-color-bg-interactive-brand-strong);
	--wp-ui-button-background-color-active: var(--wpds-color-bg-interactive-brand-strong-active);
	--wp-ui-button-background-color-disabled: var(--wpds-color-bg-interactive-neutral-strong-disabled);

	/* Default state: CSS property reads from the "default" custom property */
	background-color: var(--wp-ui-button-background-color);

	/* Interactive states: CSS property reads from the "active" custom property */
	&:not([data-disabled]):is(:hover, :active, :focus) {
		background-color: var(--wp-ui-button-background-color-active);
	}

	/* Disabled state: CSS property reads from the "disabled" custom property */
	&[data-disabled] {
		background-color: var(--wp-ui-button-background-color-disabled);
	}
}
```

A composition (e.g. a destructive dialog button) in a higher layer can then safely override the custom properties, and all states continue to work:

```css
@layer wp-ui-compositions {
	.destructive-button {
		--wp-ui-button-background-color: var(--wpds-color-bg-interactive-danger-strong);
		--wp-ui-button-background-color-active: var(--wpds-color-bg-interactive-danger-strong-active);
		--wp-ui-button-background-color-disabled: var(--wpds-color-bg-interactive-neutral-strong-disabled);
	}
}
```

#### The broken pattern to avoid

Do **not** reassign the same custom property in state selectors:

```css
/* DO NOT do this */
.button {
	--button-bg: blue;
	background-color: var(--button-bg);

	&:hover {
		--button-bg: darkblue; /* reassigning the variable for hover */
	}
}
```

If a higher layer then does `.special-button { --button-bg: red; }`, that override wins over the hover reassignment (because layer precedence trumps specificity). The hover state will be `red` instead of `darkblue`, and there is no way for the lower layer to recover.

### Disabled State Styling

When styling disabled states, use the `data-disabled` attribute provided by Base UI rather than targeting `disabled` or `aria-disabled` directly. Base UI applies `data-disabled` consistently regardless of whether the underlying implementation uses the native `disabled` attribute or `aria-disabled` (which depends on the `focusableWhenDisabled` prop). This keeps styles decoupled from the specific HTML attribute and avoids verbose selectors that would need to target both.
