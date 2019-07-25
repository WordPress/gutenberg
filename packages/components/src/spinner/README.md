# Spinner

Spinners are used to notify users that their action is being processed.

![Spinner component](https://wordpress.org/gutenberg/files/2019/07/spinner.png)

## Best practices

The spinner component should:

- Notify users that their request has been received and the action will soon complete.
- The spinner component should be avoided to load a page or data.

## Usage

```jsx
import { Spinner } from '@wordpress/components';

const MySpinner = () => (
	<Spinner />
);
```
