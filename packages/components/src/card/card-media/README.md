# CardMedia

`CardMedia` provides a container for full-bleed content within a [`Card`](/packages/components/src/card/card/README.md), such as images, video, or even just a background color.

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
