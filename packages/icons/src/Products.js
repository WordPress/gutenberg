
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Products( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'products', className, ariaPressed );
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
			<Path d="M17 8h1v11H2V8h1V6c0-2.76 2.24-5 5-5 .71 0 1.39.15 2 .42.61-.27 1.29-.42 2-.42 2.76 0 5 2.24 5 5v2zM5 6v2h2V6c0-1.13.39-2.16 1.02-3H8C6.35 3 5 4.35 5 6zm10 2V6c0-1.65-1.35-3-3-3h-.02c.63.84 1.02 1.87 1.02 3v2h2zm-5-4.22C9.39 4.33 9 5.12 9 6v2h2V6c0-.88-.39-1.67-1-2.22z" />
		</SVG>
	);
}
