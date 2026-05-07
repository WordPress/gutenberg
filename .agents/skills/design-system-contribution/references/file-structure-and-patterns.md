# File Structure & Patterns

## Directory Layout

```
packages/ui/src/{component-name}/
├── index.ts              # Public exports
├── {component-name}.tsx  # Main component (or sub-components for compound)
├── types.ts              # Prop type definitions
├── style.module.css      # CSS Module styles
├── stories/
│   └── index.story.tsx   # Storybook stories
└── test/
    └── {component-name}.test.tsx
```

For compound components (Dialog, Tabs, etc.), each sub-component gets its own file:

```
packages/ui/src/dialog/
├── index.ts          # Named exports: Root, Trigger, Popup, Header, Content, Footer, Title, etc.
├── root.tsx
├── trigger.tsx
├── popup.tsx
├── content.tsx
├── header.tsx
├── footer.tsx
├── title.tsx
├── action.tsx
├── close-icon.tsx
├── types.ts
├── style.module.css
├── stories/
└── test/
```

## Pattern A: Custom component (`useRender` + `mergeProps`)

Use when building a component that doesn't wrap a Base UI primitive:

```tsx
import { useRender, mergeProps } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import type { MyComponentProps } from './types';
import styles from './style.module.css';

export const MyComponent = forwardRef< HTMLDivElement, MyComponentProps >(
  function MyComponent( { render, className, ...props }, ref ) {
    return useRender( {
      render,
      ref,
      props: mergeProps< 'div' >( props, {
        className: clsx( styles.root, className ),
      } ),
    } );
  }
);
```

Used by: `Stack`, `Text`, `Dialog.Content`, `Dialog.Header`, `Dialog.Footer`

## Pattern B: Wrapping Base UI (`_Component`)

Use when wrapping a Base UI primitive to add styling and defaults:

```tsx
import { Button as _Button } from '@base-ui/react/button';
import { forwardRef } from '@wordpress/element';
import type { ButtonProps } from './types';
import styles from './style.module.css';

export const Button = forwardRef< HTMLButtonElement, ButtonProps >(
  function Button( { variant = 'solid', tone = 'brand', className, ...props }, ref ) {
    return (
      <_Button
        ref={ ref }
        className={ clsx(
          styles.button,
          styles[ `is-${ variant }` ],
          styles[ `is-${ tone }` ],
          className,
        ) }
        { ...props }
      />
    );
  }
);
```

Used by: `Button`, `Dialog.Root`, `Dialog.Trigger`, `Dialog.Popup`, `Tooltip.*`

Note: always alias Base UI imports with underscore prefix (`_Button`, `_Dialog`).

## Exports

Two compound component patterns:

```tsx
// Object.assign — for optional sub-components
import { Button as ButtonButton } from './button';
import { ButtonIcon } from './icon';
export const Button = Object.assign( ButtonButton, { Icon: ButtonIcon } );

// Namespace export — for required composition
// In packages/ui/src/index.ts:
export * as Dialog from './dialog';  // → Dialog.Root, Dialog.Trigger, etc.
```

Then in `packages/ui/src/index.ts`, add your component export.

## Types

```tsx
import { type ComponentProps } from '../utils/types';

// Pattern A (custom element):
export interface MyComponentProps extends ComponentProps< 'div' > {
  gap?: GapSize;
}

// Pattern B (wrapping Base UI):
import { type Button as _Button } from '@base-ui/react/button';
type _ButtonProps = ComponentProps< typeof _Button >;
export interface ButtonProps extends Omit< _ButtonProps, 'disabled' > {
  variant?: 'solid' | 'outline' | 'minimal' | 'unstyled';
  disabled?: boolean;
}
```

`ComponentProps<E>` (from `utils/types.ts`) strips and re-declares `className`, `style`, `render`, `children`. Add JSDoc with `@default` on every prop.
