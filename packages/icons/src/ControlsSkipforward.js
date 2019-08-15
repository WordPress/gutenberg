
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function ControlsSkipforward( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'controls-skipforward', className, ariaPressed );
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
			<Path d="M8 12.4L2 16V4l6 3.6V4l8 4.8V4h2v12h-2v-4.8L8 16v-3.6z" />
		</SVG>
	);
}
