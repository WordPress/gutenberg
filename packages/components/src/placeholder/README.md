# Placeholder

## Usage

```jsx
import { Placeholder } from '@wordpress/components';
import { more } from '@wordpress/icons';

const MyPlaceholder = () => <Placeholder icon={ more } label="Placeholder" />;
```

### Props

| Name             | Type                | Default     | Description                                                       |
| ---------------- | ------------------- | ----------- | ----------------------------------------------------------------- |
| `icon`           | `string, WPElement` | `undefined` | If provided, renders an icon next to the label.                   |
| `label`          | `string`            | `undefined` | Renders a label for the placeholder.                              |
| `instructions`   | `string`            | `undefined` | Renders instruction text below label.                             |
| `isColumnLayout` | `bool`              | `false`     | Changes placeholder children layout from flex-row to flex-column. |
