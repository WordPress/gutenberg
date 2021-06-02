# CardMedia

`CardMedia` provides a container for media elements within a [`Card`](../card/README.md).

## Usage

```jsx
import { Card, CardBody, CardMedia } from '@wordpress/components';

const Example = () => (
	<Card>
		<CardMedia>
			<img src="..." />
		</CardMedia>
		<CardBody>...</CardBody>
	</Card>
);
```

## Placement

`CardMedia` can be placed in any order as a direct child of a `Card` (it can also exist as the only child component). The styles will automatically round the corners of the inner media element.
