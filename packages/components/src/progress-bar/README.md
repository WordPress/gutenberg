# ProgressBar

A simple horizontal progress bar component.

Supports two modes: determinate and indeterminate. A progress bar is determinate when a specific progress value has been specified (from 0 to 100), and indeterminate when a value hasn't been specified.

## Usage

```jsx
import { ProgressBar } from '@wordpress/components';

const MyLoadingComponent = () => {
  return <ProgressBar />
}
```

The ProgressBar will expand to take all the available horizontal space of its immediate parent container element. To control its width, you can:

Pass a custom CSS `className` that takes care of setting the `width`:

```css
.my-css-class {
  width: 160px;
}
```

```jsx
import { ProgressBar } from '@wordpress/components';

const MyLoadingComponent = () => {
  return <ProgressBar className="my-css-class" />;
};
```

Wrap it in a container element (e.g `<div>`) that has a `width` specified:

```jsx
import { ProgressBar } from '@wordpress/components';

const MyLoadingComponent = ( props ) => {
  return (
		<div style={ { width: '160px' } }>
			<ProgressBar />
		</div>
	);
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

- Required: No

#### Inherited props

Any additional props will be passed the underlying `<progress/>` element.
