
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function PostStatus( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'post-status', className, ariaPressed );
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
			<Path d="M14 6c0 1.86-1.28 3.41-3 3.86V16c0 1-2 2-2 2V9.86c-1.72-.45-3-2-3-3.86 0-2.21 1.79-4 4-4s4 1.79 4 4zM8 5c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1z" />
		</SVG>
	);
}
