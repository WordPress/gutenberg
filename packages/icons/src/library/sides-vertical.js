/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

const sidesVertical = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			d="m8 6.5h8v-1.5h-8zm0 12.5h8v-1.5h-8zm-3-3h1.5v-8h-1.5zm12.5-8v8h1.5v-8z"
			style={ { fill: '#1e1e1e', opacity: 0.25 } }
		/>
		<Path d="m8 6.5h8v-1.5h-8z" />
		<Path d="m8 19h8v-1.5h-8z" />
	</SVG>
);

export default sidesVertical;
