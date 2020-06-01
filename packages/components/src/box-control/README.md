# BoxControl

BoxControl components let users set values for Top, Right, Bottom, and Left. This can be used as an input control for values like `padding` or `margin`.

## Usage

```jsx
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';
import { useState } from '@wordpress/compose';

const Example = () => {
	const [ values, setValues ] = useState( {
		top: '50px',
		left: '10%',
		right: '10%',
		bottom: '50px',
	} );

	return (
		<BoxControl
			value={ value }
			onChange={ ( nextValues ) => setValues( nextValues ) }
		/>
	);
};
```

### Visualizer

BoxControl provides a companion component that visually renders value changes. Place the component you would like the sides visualized within the companion `<Visualizer>` component.

```jsx
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';
import { useState } from '@wordpress/compose';

import MyComponent from './my-component';

const { Visualizer } = BoxControl;

const Example = () => {
	const [ values, setValues ] = useState( {
		top: '50px',
		left: '10%',
		right: '10%',
		bottom: '50px',
	} );

	return (
		<>
			<BoxControl
				value={ value }
				onChange={ ( nextValues ) => setValues( nextValues ) }
			/>
			<Visualizer>
				<MyComponent />
			</Visualizer>
		</>
	);
};
```

Alternatively, the `<Visualizer>` can be nested as a sibling to the component you would like visualized. Using `<Visualizer />` in this manner will require the parent element having a `position` style.

```jsx
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';
import { useState } from '@wordpress/compose';

import MyComponent from './my-component';

const { Visualizer } = BoxControl;

const Example = () => {
	const [ values, setValues ] = useState( {
		top: '50px',
		left: '10%',
		right: '10%',
		bottom: '50px',
	} );

	return (
		<>
			<BoxControl
				value={ value }
				onChange={ ( nextValues ) => setValues( nextValues ) }
			/>
			<div style={ { position: 'relative' } }>
				<Visualizer />
				<MyComponent />
			</div>
		</>
	);
};
```

## Props

### inputProps

Props for the internal [InputControl](../input-control) components.

-   Type: `Object`
-   Required: No

### label

Heading label for BoxControl.

-   Type: `String`
-   Required: No
-   Default: `Box Control`

### onChange

A function that receives the values of the inputs.

-   Type: `Function`
-   Required: Yes

### units

Collection of available units which are compatible with [UnitControl](../unit-control).

-   Type: `Array<Object>`
-   Required: No

### values

The `top`, `right`, `bottom`, and `left` box dimension values.

-   Type: `Object`
-   Required: No
