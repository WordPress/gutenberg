
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Menu( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'menu', className, ariaPressed );
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
			<Path d="M17 7V5H3v2h14zm0 4V9H3v2h14zm0 4v-2H3v2h14z" />
		</SVG>
	);
}
