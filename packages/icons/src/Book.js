
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Book( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'book', className, ariaPressed );
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
			<Path d="M16 3h2v16H5c-1.66 0-3-1.34-3-3V4c0-1.66 1.34-3 3-3h9v14H5c-.55 0-1 .45-1 1s.45 1 1 1h11V3z" />
		</SVG>
	);
}
