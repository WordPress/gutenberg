
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Sort( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'sort', className, ariaPressed );
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
			<Path d="M11 7H1l5 7zm-2 7h10l-5-7z" />
		</SVG>
	);
}
