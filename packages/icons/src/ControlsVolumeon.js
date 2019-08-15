
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ControlsVolumeon( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'controls-volumeon', className, ariaPressed );
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
			<Path d="M2 7h4l5-4v14l-5-4H2V7zm12.69-2.46C14.82 4.59 18 5.92 18 10s-3.18 5.41-3.31 5.46c-.06.03-.13.04-.19.04-.2 0-.39-.12-.46-.31-.11-.26.02-.55.27-.65.11-.05 2.69-1.15 2.69-4.54 0-3.41-2.66-4.53-2.69-4.54-.25-.1-.38-.39-.27-.65.1-.25.39-.38.65-.27zM16 10c0 2.57-2.23 3.43-2.32 3.47-.06.02-.12.03-.18.03-.2 0-.39-.12-.47-.32-.1-.26.04-.55.29-.65.07-.02 1.68-.67 1.68-2.53s-1.61-2.51-1.68-2.53c-.25-.1-.38-.39-.29-.65.1-.25.39-.39.65-.29.09.04 2.32.9 2.32 3.47z" />
		</SVG>
	);
}
