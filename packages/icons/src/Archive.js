
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Archive( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'archive', className, ariaPressed );
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
			<Path d="M19 4v2H1V4h18zM2 7h16v10H2V7zm11 3V9H7v1h6z" />
		</SVG>
	);
}
