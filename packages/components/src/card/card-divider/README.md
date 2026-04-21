# CardDivider

`CardDivider` renders an optional divider within a [`Card`](/packages/components/src/card/card/README.md). It is typically used to divide multiple `CardBody` components from each other.

## Usage

```jsx
import { Card, CardBody, CardDivider } from '@wordpress/components';

const Example = () => (
	<Card>
		<CardBody>...</CardBody>
		<CardDivider />
		<CardBody>...</CardBody>
	</Card>
);
```

## Props

### Inherited props

`CardDivider` inherits all of the [`Divider` props](/packages/components/src/divider/README.md#props).
