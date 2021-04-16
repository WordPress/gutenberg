# ButtonGroup

`ButtonGroup` is a form component that groups related buttons together. It can also coordinate the checked state of multiple `Button` components.

## Usage

```jsx
import { Button, ButtonGroup } from '@wordpress/components/ui';

const Example = () => {
	return (
		<ButtonGroup>
			<Button>Code</Button>
			<Button>Is</Button>
			<Button>Poetry</Button>
		</ButtonGroup>
	);
};
```

### Radio group

A `ButtonGroup` can also be used to create a [radio group](https://www.w3.org/TR/wai-aria-practices/#radiobutton), highlighting a single selected value within the group.

```jsx
import { Button, ButtonGroup } from '@wordpress/components/ui';
import { useState } from '@wordpress/element';

const Example = () => {
	const [ value, setValue ] = useState( 'code' );

	return (
		<ButtonGroup value={ value } onChange={ setValue }>
			<Button value="code">Code</Button>
			<Button value="is">Is</Button>
			<Button value="poetry">Poetry</Button>
		</ButtonGroup>
	);
};
```
