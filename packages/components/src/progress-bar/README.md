# ProgressBar

A simple horizontal progress bar component.

Supports two modes: determinate and indeterminate. A progress bar is determinate when a specific progress value has been specified (from 0 to 100), and indeterminate when a value hasn't been specified.

### Usage

```jsx
/**
 * WordPress dependencies
 */
import { __experimentalProgressBar as ProgressBar } from '@wordpress/components';

export const MyProgressBar = () => {
	return <ProgressBar value={ 30 } />;
};
```

### Props

The component accepts the following props:

#### `value`: `number`

The progress value, a number from 0 to 100.
If a `value` is not specified, the progress bar will be considered indeterminate.

-   Required: No

#### `trackColor`: `string`

Optional color of the progress bar track.

-   Required: No

#### `indicatorColor`: `string`

Optional color of the progress bar indicator.

-   Required: No

##### `className`: `string`

A CSS class to apply to the underlying `div` element, serving as a progress bar track.

- Required: No
