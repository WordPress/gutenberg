
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Laptop( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'laptop', className, ariaPressed );
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
			<Path d="M3 3h14c.6 0 1 .4 1 1v10c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1V4c0-.6.4-1 1-1zm13 2H4v8h12V5zm-3 1H5v4zm6 11v-1H1v1c0 .6.5 1 1.1 1h15.8c.6 0 1.1-.4 1.1-1z" />
		</SVG>
	);
}
