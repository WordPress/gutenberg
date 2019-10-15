# CardMedia

CardMedia provides a container for media elements, and renders within a [`<Card />`](../).

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

`<CardMedia />` can be placed in any order as a direct child of a `<Card />`. The styles will automatically round the corners of the inner media element.

### Top

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

### Center

```jsx
import { Card, CardBody, CardMedia } from '@wordpress/components';

const Example = () => (
	<Card>
		<CardBody>...</CardBody>
		<CardMedia>
			<img src="..." />
		</CardMedia>
		<CardBody>...</CardBody>
	</Card>
);
```

### Bottom

```jsx
import { Card, CardBody, CardMedia } from '@wordpress/components';

const Example = () => (
	<Card>
		<CardBody>...</CardBody>
		<CardMedia>
			<img src="..." />
		</CardMedia>
	</Card>
);
```

### Only

`<CardMedia />` can also exist as the only child component of `<Card />`.

```jsx
import { Card, CardMedia } from '@wordpress/components';

const Example = () => (
	<Card>
		<CardMedia>
			<img src="..." />
		</CardMedia>
	</Card>
);
```
