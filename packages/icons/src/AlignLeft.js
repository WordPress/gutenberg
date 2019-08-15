
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function AlignLeft( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'align-left', className, ariaPressed );
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
			<Path d="M3 5h14V3H3v2zm9 8V7H3v6h9zm2-4h3V7h-3v2zm0 4h3v-2h-3v2zM3 17h14v-2H3v2z" />
		</SVG>
	);
}
