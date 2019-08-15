
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Migrate( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'migrate', className, ariaPressed );
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
			<Path d="M4 6h6V4H2v12.01h8V14H4V6zm2 2h6V5l6 5-6 5v-3H6V8z" />
		</SVG>
	);
}
