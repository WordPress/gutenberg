# Placeholder

## Usage

```jsx
import { Placeholder } from '@wordpress/components';
import { more } from '@wordpress/icons';

const MyPlaceholder = () => <Placeholder icon={ more } label="Placeholder" />;
```

## Props

### `className`: `string`

Class to set on the container div.

-   Required: No

### `icon`: `string|Function|WPComponent|null`

If provided, renders an icon next to the label.

-   Required: No

### `instructions`: `string`

Instructions of the placeholder.

-   Required: No

### `isColumnLayout`: `boolean`

Changes placeholder children layout from flex-row to flex-column.

-   Required: No

### `label`: `string`

Title of the placeholder.

-   Required: No

### `notices`: `ReactNode`

A rendered notices list

-   Required: No

### `preview`: `ReactNode`

Preview to be rendered in the placeholder.

-   Required: No

### `withIllustration`: `boolean`

Outputs a placeholder illustration.

-   Required: No
