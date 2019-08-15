
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Tagcloud( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'tagcloud', className, ariaPressed );
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
			<Path d="M11 3v4H1V3h10zm8 0v4h-7V3h7zM7 8v3H1V8h6zm12 0v3H8V8h11zM9 12v2H1v-2h8zm10 0v2h-9v-2h9zM6 15v1H1v-1h5zm5 0v1H7v-1h4zm3 0v1h-2v-1h2zm5 0v1h-4v-1h4z" />
		</SVG>
	);
}
