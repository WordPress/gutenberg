# Component Patterns & Types

## Discovering Available Components

To enumerate the current set of components, in order of preference:

1. The `get_components` MCP tool (if `design-system-mcp` is configured) — always reflects the latest published manifest.
2. `ls packages/ui/src/` in the Gutenberg repo — the directory names are the component sources.
3. The package README at `packages/ui/README.md`.

Components are either **direct exports** (`Button`, `Stack`) or **namespace exports** (`Dialog.Root`, `Dialog.Trigger`, `Dialog.Popup`). Do not rely on a hardcoded list inside this skill — the set evolves.

## Pattern A: Custom component with `useRender` + `mergeProps`

For components not wrapping a Base UI primitive:

```tsx
import { useRender, mergeProps } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import type { StackProps } from './types';
import styles from './style.module.css';

export const Stack = forwardRef< HTMLDivElement, StackProps >(
  function Stack( { direction, gap, align, justify, wrap, render, ...props }, ref ) {
    const style = {
      gap: gap && gapTokens[ gap ],
      alignItems: align,
      justifyContent: justify,
      flexDirection: direction,
      flexWrap: wrap,
    };
    return useRender( {
      render,
      ref,
      props: mergeProps< 'div' >( props, { style, className: styles.stack } ),
    } );
  }
);
```

Key: `useRender` enables the consumer `render` prop. `mergeProps` merges internal + external props safely.

## Pattern B: Wrapping a Base UI primitive

For components that delegate behavior to Base UI:

```tsx
import { Button as _Button } from '@base-ui/react/button';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ButtonProps } from './types';
import styles from './style.module.css';
import resetStyles from '../utils/css/resets.module.css';
import focusStyles from '../utils/css/focus.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';

export const Button = forwardRef< HTMLButtonElement, ButtonProps >(
  function Button( { tone = 'brand', variant = 'solid', size = 'default', className, ...props }, ref ) {
    return (
      <_Button
        ref={ ref }
        className={ clsx(
          defenseStyles.button,
          resetStyles[ 'box-sizing' ],
          focusStyles[ 'outset-ring--focus-except-active' ],
          variant !== 'unstyled' && styles.button,
          styles[ `is-${ tone }` ],
          styles[ `is-${ variant }` ],
          styles[ `is-${ size }` ],
          className,
        ) }
        { ...props }
      />
    );
  }
);
```

Key: No `useRender` needed — Base UI handles the `render` prop internally via `...props`.

## Compound Components

Two patterns for multi-part components:

```tsx
// Object.assign — optional sub-components (e.g., Button.Icon)
export const Button = Object.assign( ButtonButton, { Icon: ButtonIcon } );

// Namespace export — required composition (e.g., Dialog.Root, Dialog.Trigger)
export * as Dialog from './dialog';
```

## Custom render prop

The `render` prop lets consumers control the rendered element:

```tsx
<Stack render={ <section /> } gap="md">Content</Stack>
<Text render={ <label /> } variant="body-sm">Label</Text>
```

Both function and element forms are supported:
- Element: `render={ <section className="custom" /> }`
- Function: `render={ ( props ) => <section { ...props } /> }`

## Types

Prop types derive from Base UI or native HTML, extended with component-specific props:

```tsx
import { type ComponentProps } from '../utils/types';

// For Pattern A (custom element):
export interface StackProps extends ComponentProps< 'div' > {
  gap?: GapSize;  // GapSize from @wordpress/theme
  direction?: 'row' | 'column';
}

// For Pattern B (wrapping Base UI):
type _ButtonProps = ComponentProps< typeof _Button >;
export interface ButtonProps extends Omit< _ButtonProps, 'disabled' > {
  variant?: 'solid' | 'outline' | 'minimal' | 'unstyled';
  tone?: 'brand' | 'neutral';
  size?: 'default' | 'compact' | 'small';
  disabled?: boolean;
}
```

`ComponentProps<E>` (from `utils/types.ts`) strips and re-declares `className`, `style`, `render`, and `children` with proper types. Use JSDoc with `@default` annotations on every prop.

## Theming

`ThemeProvider` is a **private API** — only accessible within Gutenberg via `unlock()`:

```tsx
const ThemeProvider = unlock( themePrivateApis ).ThemeProvider;
```

It accepts `color.primary`, `color.bg`, `cursor.control`, and `density` props. External consumers cannot use it directly — they customize by loading different token stylesheets or overriding CSS custom properties on a wrapper element.
