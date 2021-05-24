# BoxControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

BoxControl components let users set values for Top, Right, Bottom, and Left. This can be used as an input control for values like `padding` or `margin`.

## Usage

```jsx
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const Example = () => {
	const [ values, setValues ] = useState( {
		top: '50px',
		left: '10%',
		right: '10%',
		bottom: '50px',
	} );

	return (
		<BoxControl
			values={ values }
			onChange={ ( nextValues ) => setValues( nextValues ) }
		/>
	);
};
```

### Visualizer

BoxControl provides a companion component that visually renders value changes. Place the component you would like the sides visualized within the companion `<Visualizer>` component.

```jsx
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

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
				values={ values }
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
import { useState } from '@wordpress/element';

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
				values={ values }
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

A callback function when an input value changes.

-   Type: `Function`
-   Required: Yes

### onChangeShowVisualizer

A callback function for visualizer changes, based on input hover interactions.

-   Type: `Function`
-   Required: Yes

### sides

Collection of sides to allow control of. If omitted or empty, all sides will be available.

-   Type: `Array<Object>`
-   Required: No

### units

Collection of available units which are compatible with [UnitControl](../unit-control).

-   Type: `Array<Object>`
-   Required: No

### values

The `top`, `right`, `bottom`, and `left` box dimension values.

-   Type: `Object`
-   Required: No
