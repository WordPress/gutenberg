# Testing & Storybook Conventions

## Testing

```tsx
import { createRef } from '@wordpress/element';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../index';  // always import from index

describe( 'Button', () => {
  it( 'renders a button element', () => {
    render( <Button>Click me</Button> );
    expect( screen.getByRole( 'button', { name: 'Click me' } ) ).toBeVisible();
  } );

  it( 'is focusable when disabled', async () => {
    const user = userEvent.setup();
    render( <Button disabled>Click me</Button> );
    await user.keyboard( '{Tab}' );
    expect( screen.getByRole( 'button' ) ).toHaveFocus();
  } );
} );
```

### Conventions

- Role-based queries (`getByRole`), not text/class queries
- `userEvent.setup()` for interaction testing
- `waitFor` for async appearance (dialogs, popovers)
- `createRef` from `@wordpress/element` for ref tests
- Import from `../index`, not internal files

## Stories

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../index';

const meta: Meta< typeof Button > = {
  title: 'Design System/Components/Button',
  component: Button,
};
export default meta;
type Story = StoryObj< typeof Button >;

export const Default: Story = { args: { children: 'Button' } };
export const Outline: Story = { args: { ...Default.args, variant: 'outline' } };
```

### Conventions

- Import from `@storybook/react-vite` (not `@storybook/react`)
- Title: `'Design System/Components/{Name}'`
- Spread `Default.args` for variant stories
- Complex stories use render functions with `useState`
- Compound components list `subcomponents` in meta
