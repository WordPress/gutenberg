
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Leftright( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'leftright', className, ariaPressed );
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
			<Path d="M3 10.03L9 6v8zM11 6l6 4.03L11 14V6z" />
		</SVG>
	);
}
