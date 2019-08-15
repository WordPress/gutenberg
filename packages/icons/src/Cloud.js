
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Cloud( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'cloud', className, ariaPressed );
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
			<Path d="M14.9 9c1.8.2 3.1 1.7 3.1 3.5 0 1.9-1.6 3.5-3.5 3.5h-10C2.6 16 1 14.4 1 12.5 1 10.7 2.3 9.3 4.1 9 4 8.9 4 8.7 4 8.5 4 7.1 5.1 6 6.5 6c.3 0 .7.1.9.2C8.1 4.9 9.4 4 11 4c2.2 0 4 1.8 4 4 0 .4-.1.7-.1 1z" />
		</SVG>
	);
}
