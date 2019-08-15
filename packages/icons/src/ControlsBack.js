
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function ControlsBack( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'controls-back', className, ariaPressed );
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
			<Path d="M2 10l10-6v3.6L18 4v12l-6-3.6V16z" />
		</SVG>
	);
}
