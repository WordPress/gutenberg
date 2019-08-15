
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function PlaylistVideo( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'playlist-video', className, ariaPressed );
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
			<Path d="M17 3V1H2v2h15zm0 4V5H2v2h15zM6 11V9H2v2h4zm2-2h9c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1H8c-.55 0-1-.45-1-1v-8c0-.55.45-1 1-1zm3 7l3.33-2L11 12v4zm-5-1v-2H2v2h4zm0 4v-2H2v2h4z" />
		</SVG>
	);
}
