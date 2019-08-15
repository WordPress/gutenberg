
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function MenuAlt( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'menu-alt', className, ariaPressed );
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
			<Path d="M3 4h14v2H3V4zm0 5h14v2H3V9zm0 5h14v2H3v-2z" />
		</SVG>
	);
}
