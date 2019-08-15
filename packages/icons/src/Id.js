
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Id( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'id', className, ariaPressed );
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
			<Path d="M18 16H2V4h16v12zM7.05 8.53c.13-.07.24-.15.33-.24.09-.1.17-.21.24-.34.07-.14.13-.26.17-.37s.07-.22.1-.34L7.95 7c0-.04.01-.07.01-.09.05-.32.03-.61-.04-.9-.08-.28-.23-.52-.46-.72C7.23 5.1 6.95 5 6.6 5c-.2 0-.39.04-.56.11-.17.08-.31.18-.41.3-.11.13-.2.27-.27.44-.07.16-.11.33-.12.51s0 .36.01.55l.02.09c.01.06.03.15.06.25s.06.21.1.33.1.25.17.37c.08.12.16.23.25.33s.2.19.34.25c.13.06.28.09.43.09s.3-.03.43-.09zM17 9V5h-5v4h5zm-10.38.83l-1.38-.88c-.41 0-.79.11-1.14.32-.35.22-.62.5-.81.85-.19.34-.29.7-.29 1.07v1.25l.2.05c.13.04.31.09.55.14.24.06.51.12.8.17.29.06.62.1 1 .14.37.04.73.06 1.07.06s.69-.02 1.07-.06.7-.09.98-.14c.27-.05.54-.1.82-.17.27-.06.45-.11.54-.13.09-.03.16-.05.21-.06v-1.25c0-.36-.1-.72-.31-1.07s-.49-.64-.84-.86-.72-.33-1.11-.33zM17 11v-1h-5v1h5zm0 2v-1h-5v1h5zm0 2v-1H3v1h14z" />
		</SVG>
	);
}
