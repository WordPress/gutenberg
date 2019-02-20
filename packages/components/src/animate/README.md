# Animate

Simple interface to introduce animations to components. 

## Usage

```jsx
import { Animate } from '@wordpress/components';

const MyAnimatedNotice = () => (
	<Animate todo="Add missing props">
		{ ( { className } ) => (
			<Notice className={ className } status="success">
				<p>Animation finished.</p>
			</Notice>
		) }
	</Animate>
);
```

## Props

Name | Type | Default | Description
--- | --- | --- | ---
`type` | `string` | `undefined` | Type of the animation to use.
`options` | `object` | `{}` | Options of the chosen animation.
`children` | `function` | `undefined` | A callback receiving a list of props ( `className` ) to apply to the DOM element to animate.

## Available Animation Types

### appear

This animation is meant for popover/modal content, such as menus appearing. It shows the height and width of the animated element scaling from 0 to full size, from its point of origin. 

#### Options

Name | Type | Default | Description
--- | --- | --- | ---
`origin` | `string` | `top center` | Point of origin (`top`, `bottom`,` middle right`, `left`, `center`).

### slide-in

This animation is meant for sidebars and sliding menus. It shows the height and width of the animated element moving from a hidden position to its normal one.

#### Options

Name | Type | Default | Description
--- | --- | --- | ---
`origin` | `string` | `left` | Point of origin (`left`).
