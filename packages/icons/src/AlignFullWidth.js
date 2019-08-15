
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function AlignFullWidth( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'align-full-width', className, ariaPressed );
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
			<Path d="M17 13V3H3v10h14zM5 17h10v-2H5v2z" />
		</SVG>
	);
}
