
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function MediaCode( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'media-code', className, ariaPressed );
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
			<Path d="M12 2l4 4v12H4V2h8zM9 13l-2-2 2-2-1-1-3 3 3 3zm3 1l3-3-3-3-1 1 2 2-2 2z" />
		</SVG>
	);
}
