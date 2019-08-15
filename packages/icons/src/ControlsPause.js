
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ControlsPause( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'controls-pause', className, ariaPressed );
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
			<Path d="M5 16V4h3v12H5zm7-12h3v12h-3V4z" />
		</SVG>
	);
}
