
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Pressthis( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'pressthis', className, ariaPressed );
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
			<Path d="M14.76 1C16.55 1 18 2.46 18 4.25c0 1.78-1.45 3.24-3.24 3.24-.23 0-.47-.03-.7-.08L13 8.47V19H2V4h9.54c.13-2 1.52-3 3.22-3zm0 5.49C16 6.49 17 5.48 17 4.25 17 3.01 16 2 14.76 2s-2.24 1.01-2.24 2.25c0 .37.1.72.27 1.03L9.57 8.5c-.28.28-1.77 2.22-1.5 2.49.02.03.06.04.1.04.49 0 2.14-1.28 2.39-1.53l3.24-3.24c.29.14.61.23.96.23z" />
		</SVG>
	);
}
