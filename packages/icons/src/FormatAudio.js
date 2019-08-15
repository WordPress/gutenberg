
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function FormatAudio( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'format-audio', className, ariaPressed );
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
			<Path d="M6.99 3.08l11.02-2c.55-.08.99.45.99 1V14.5c0 1.94-1.57 3.5-3.5 3.5S12 16.44 12 14.5c0-1.93 1.57-3.5 3.5-3.5.54 0 1.04.14 1.5.35V5.08l-9 2V16c-.24 1.7-1.74 3-3.5 3C2.57 19 1 17.44 1 15.5 1 13.57 2.57 12 4.5 12c.54 0 1.04.14 1.5.35V4.08c0-.55.44-.91.99-1z" />
		</SVG>
	);
}
