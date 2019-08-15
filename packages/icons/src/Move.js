
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Move( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'move', className, ariaPressed );
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
			<Path d="M19 10l-4 4v-3h-4v4h3l-4 4-4-4h3v-4H5v3l-4-4 4-4v3h4V5H6l4-4 4 4h-3v4h4V6z" />
		</SVG>
	);
}
