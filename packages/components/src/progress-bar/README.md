# ProgressBar

A simple horizontal progress bar component.

Supports two modes: determinate and indeterminate. A progress bar is determinate when a specific progress value has been specified (from 0 to 100), and indeterminate when a value hasn't been specified.

## Usage

Basic usage:

```jsx
import { ProgressBar } from '@wordpress/components';

const MyLoadingComponent = () => {
	return <ProgressBar />;
};
```

You can also make it determinate by passing a `value` (from 0 to 100) representing the progress:

```jsx
import { ProgressBar } from '@wordpress/components';

const MyLoadingComponent = ( { progress } ) => {
	return <ProgressBar value={ progress } />;
};
```

You can customize its appearance by passing a custom CSS class name to `className`.

```css
.my-custom-progress-bar {
	width: 100%;
}
```

```jsx
import { ProgressBar } from '@wordpress/components';

const MyLoadingComponent = () => {
	return <ProgressBar className="my-custom-progress-bar" />;
};
```

### Props

The component accepts the following props:

#### `value`: `number`

The progress value, a number from 0 to 100.
If a `value` is not specified, the progress bar will be considered indeterminate.

-   Required: No

#### `className`: `string`

A CSS class to apply to the underlying `div` element, serving as a progress bar track.

-   Required: No

#### Inherited props

Any additional props will be passed the underlying `<progress/>` element.
