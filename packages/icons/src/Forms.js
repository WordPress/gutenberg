
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Forms( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'forms', className, ariaPressed );
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
			<Path d="M2 2h7v7H2V2zm9 0v7h7V2h-7zM5.5 4.5L7 3H4zM12 8V3h5v5h-5zM4.5 5.5L3 4v3zM8 4L6.5 5.5 8 7V4zM5.5 6.5L4 8h3zM9 18v-7H2v7h7zm9 0h-7v-7h7v7zM8 12v5H3v-5h5zm6.5 1.5L16 12h-3zM12 16l1.5-1.5L12 13v3zm3.5-1.5L17 16v-3zm-1 1L13 17h3z" />
		</SVG>
	);
}
