
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function CoverImage( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'cover-image', className, ariaPressed );
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
			<Path d="M2.2 1h15.5c.7 0 1.3.6 1.3 1.2v11.5c0 .7-.6 1.2-1.2 1.2H2.2c-.6.1-1.2-.5-1.2-1.1V2.2C1 1.6 1.6 1 2.2 1zM17 13V3H3v10h14zm-4-4s0-5 3-5v7c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1V7c2 0 3 4 3 4s1-4 3-4 3 2 3 2zM4 17h12v2H4z" />
		</SVG>
	);
}
