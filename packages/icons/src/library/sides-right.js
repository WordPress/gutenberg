/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

const sidesRight = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M20.5 7H19v10h1.5V7z" style={ { fill: '#1e1e1e' } } />
		<Path
			d="M3.5 17H5V7H3.5v10zM7 20.5h10V19H7v1.5zm0-17V5h10V3.5H7z"
			style={ { fill: '#1e1e1e', opacity: 0.1 } }
		/>
	</SVG>
);

export default sidesRight;
