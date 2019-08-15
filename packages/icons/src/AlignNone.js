
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function AlignNone( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'align-none', className, ariaPressed );
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
			<Path d="M3 5h14V3H3v2zm10 8V7H3v6h10zM3 17h14v-2H3v2z" />
		</SVG>
	);
}
