# Spinner

Spinners notify users that their action is being processed.

![Spinner component](https://wordpress.org/gutenberg/files/2019/07/spinner.png)

## Best practices

The spinner component should:

- Signal to users that the processing of their request is underway and will soon complete.
- Not appear when pages or data are loading.

## Usage

```jsx
import { Spinner } from '@wordpress/components';

const MySpinner = () => (
	<Spinner />
);
```
