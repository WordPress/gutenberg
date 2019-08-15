
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function VideoAlt( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'video-alt', className, ariaPressed );
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
			<Path d="M8 5c0-.55-.45-1-1-1H2c-.55 0-1 .45-1 1 0 .57.49 1 1 1h5c.55 0 1-.45 1-1zm6 5l4-4v10l-4-4v-2zm-1 4V8c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h8c.55 0 1-.45 1-1z" />
		</SVG>
	);
}
