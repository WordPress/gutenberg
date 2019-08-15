
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function MediaAudio( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'media-audio', className, ariaPressed );
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
			<Path d="M12 2l4 4v12H4V2h8zm0 4h3l-3-3v3zm1 7.26V8.09c0-.11-.04-.21-.12-.29-.07-.08-.16-.11-.27-.1 0 0-3.97.71-4.25.78C8.07 8.54 8 8.8 8 9v3.37c-.2-.09-.42-.07-.6-.07-.38 0-.7.13-.96.39-.26.27-.4.58-.4.96 0 .37.14.69.4.95.26.27.58.4.96.4.34 0 .7-.04.96-.26.26-.23.64-.65.64-1.12V10.3l3-.6V12c-.67-.2-1.17.04-1.44.31-.26.26-.39.58-.39.95 0 .38.13.69.39.96.27.26.71.39 1.08.39.38 0 .7-.13.96-.39.26-.27.4-.58.4-.96z" />
		</SVG>
	);
}
