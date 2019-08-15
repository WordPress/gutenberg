
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ImageFilter( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'image-filter', className, ariaPressed );
	return (
		<SVG
			aria-hidden
			role="img"
			focusable="false"
			className={ iconClass }
			xmlns="http://www.w3.org/2000/svg"
			width={ size }
			height={ size }
			viewBox="0 0 20 20"
			{ ...props }
		>
			<Path d="M14 5.87c0-2.2-1.79-4-4-4s-4 1.8-4 4c0 2.21 1.79 4 4 4s4-1.79 4-4zM3.24 10.66c-1.92 1.1-2.57 3.55-1.47 5.46 1.11 1.92 3.55 2.57 5.47 1.47 1.91-1.11 2.57-3.55 1.46-5.47-1.1-1.91-3.55-2.56-5.46-1.46zm9.52 6.93c1.92 1.1 4.36.45 5.47-1.46 1.1-1.92.45-4.36-1.47-5.47-1.91-1.1-4.36-.45-5.46 1.46-1.11 1.92-.45 4.36 1.46 5.47z" />
		</SVG>
	);
}
