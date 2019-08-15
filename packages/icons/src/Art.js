
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Art( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'art', className, ariaPressed );
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
			<Path d="M8.55 3.06c1.01.34-1.95 2.01-.1 3.13 1.04.63 3.31-2.22 4.45-2.86.97-.54 2.67-.65 3.53 1.23 1.09 2.38.14 8.57-3.79 11.06-3.97 2.5-8.97 1.23-10.7-2.66-2.01-4.53 3.12-11.09 6.61-9.9zm1.21 6.45c.73 1.64 4.7-.5 3.79-2.8-.59-1.49-4.48 1.25-3.79 2.8z" />
		</SVG>
	);
}
