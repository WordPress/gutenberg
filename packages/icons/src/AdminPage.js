
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function AdminPage( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'admin-page', className, ariaPressed );
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
			<Path d="M6 15V2h10v13H6zm-1 1h8v2H3V5h2v11z" />
		</SVG>
	);
}
