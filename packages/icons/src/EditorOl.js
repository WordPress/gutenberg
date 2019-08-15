
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function EditorOl( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-ol', className, ariaPressed );
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
			<Path d="M6 7V3h-.69L4.02 4.03l.4.51.46-.37c.06-.05.16-.14.3-.28l-.02.42V7H6zm2-2h9v1H8V5zm-1.23 6.95v-.7H5.05v-.04l.51-.48c.33-.31.57-.54.7-.71.14-.17.24-.33.3-.49.07-.16.1-.33.1-.51 0-.21-.05-.4-.16-.56-.1-.16-.25-.28-.44-.37s-.41-.14-.65-.14c-.19 0-.36.02-.51.06-.15.03-.29.09-.42.15-.12.07-.29.19-.48.35l.45.54c.16-.13.31-.23.45-.3.15-.07.3-.1.45-.1.14 0 .26.03.35.11s.13.2.13.36c0 .1-.02.2-.06.3s-.1.21-.19.33c-.09.11-.29.32-.58.62l-.99 1v.58h2.76zM8 10h9v1H8v-1zm-1.29 3.95c0-.3-.12-.54-.37-.71-.24-.17-.58-.26-1-.26-.52 0-.96.13-1.33.4l.4.6c.17-.11.32-.19.46-.23.14-.05.27-.07.41-.07.38 0 .58.15.58.46 0 .2-.07.35-.22.43s-.38.12-.7.12h-.31v.66h.31c.34 0 .59.04.75.12.15.08.23.22.23.41 0 .22-.07.37-.2.47-.14.1-.35.15-.63.15-.19 0-.38-.03-.57-.08s-.36-.12-.52-.2v.74c.34.15.74.22 1.18.22.53 0 .94-.11 1.22-.33.29-.22.43-.52.43-.92 0-.27-.09-.48-.26-.64s-.42-.26-.74-.3v-.02c.27-.06.49-.19.65-.37.15-.18.23-.39.23-.65zM8 15h9v1H8v-1z" />
		</SVG>
	);
}
