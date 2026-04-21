/**
 * WordPress dependencies
 */
import { SVG, Rect } from '@wordpress/components';

export const circle = ( size, color ) => (
	<SVG fill="none" xmlns="http://www.w3.org/2000/svg">
		<Rect width={ size } height={ size } rx={ size / 2 } fill={ color } />
	</SVG>
);

export const circleOutline = ( size, color ) => (
	<SVG
		width={ size }
		height={ size }
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<Rect
			x="0.5"
			y="0.5"
			width={ size - 1 }
			height={ size - 1 }
			rx={ size / 2 }
			stroke={ color }
		/>
	</SVG>
);

export const square = ( size, color ) => (
	<SVG fill="none" xmlns="http://www.w3.org/2000/svg">
		<Rect width={ size } height={ size } fill={ color } />
	</SVG>
);
