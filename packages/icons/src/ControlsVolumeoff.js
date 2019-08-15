
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ControlsVolumeoff( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'controls-volumeoff', className, ariaPressed );
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
			<Path d="M2 7h4l5-4v14l-5-4H2V7z" />
		</SVG>
	);
}
