# Navigation

Navigation is a component which renders a component which renders a heirarchy of menu items.

## Usage

```jsx
import { MenuItem } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const data = [
    { title: 'My Navigation', slug: 'root', back: 'Back' },
    { title: 'Home', slug: 'home', parent: 'root', menu: 'primary' },
    { title: 'Option one', slug: 'option_one', parent: 'root', menu: 'primary' },
    { title: 'Option two', slug: 'option_two', parent: 'root', menu: 'primary' },
    { title: 'Option three', slug: 'option_three', parent: 'root', menu: 'secondary' },
    { title: 'Child one', slug: 'child_one', parent: 'option_three', menu: 'primary' },
    { title: 'Child two', slug: 'child_two', parent: 'option_three', menu: 'primary' },
    { title: 'Child three', slug: 'child_three', parent: 'option_three', menu: 'primary' },
];

const MyNavigation = () => {
    return <Navigation data={ data } initial="home" />;
};
```

## Props

Navigation supports the following props.

### `data`

- Type: `array`
- Required: Yes

An array of config objects for each menu item.

### `initial`

- Type: `string`
- Required: Yes

The active slug.