
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Redo( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'redo', className, ariaPressed );
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
			<Path d="M8 5h5V2l6 4-6 4V7H8c-2.2 0-4 1.8-4 4s1.8 4 4 4h5v2H8c-3.3 0-6-2.7-6-6s2.7-6 6-6z" />
		</SVG>
	);
}
