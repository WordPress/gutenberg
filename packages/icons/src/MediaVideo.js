
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function MediaVideo( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'media-video', className, ariaPressed );
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
			<Path d="M12 2l4 4v12H4V2h8zm0 4h3l-3-3v3zm-1 8v-3c0-.27-.1-.51-.29-.71-.2-.19-.44-.29-.71-.29H7c-.27 0-.51.1-.71.29-.19.2-.29.44-.29.71v3c0 .27.1.51.29.71.2.19.44.29.71.29h3c.27 0 .51-.1.71-.29.19-.2.29-.44.29-.71zm3 1v-5l-2 2v1z" />
		</SVG>
	);
}
