# ColorIndicator

ColorIndicator is a React component that renders a specific color in a squared box. It's often used to summarize a collection of used colors in a child component.

### Single component

![simple color indicator](https://user-images.githubusercontent.com/881729/147558034-cba09db5-2f06-458b-a7b1-fd2f2ffb982a.png)

### Used in sidebar

![multiple color indicator](https://user-images.githubusercontent.com/881729/147559177-69ce52e1-30dc-4f24-8483-ca2a580f434f.png)

## Usage

```jsx
import { ColorIndicator } from '@wordpress/components';

const MyColorIndicator = () => <ColorIndicator colorValue="#0073aa" />;
```

## Props

The component accepts the following props:

### colorValue

The color of the indicator. Any value from the [`background`](https://developer.mozilla.org/en-US/docs/Web/CSS/background) property is supported.

-   Type: `string`
-   Required: Yes

### className

Extra classes for the used `<span>` element. By default only `component-color-indicator` is added.

-   Type: `string`
-   Required: No
