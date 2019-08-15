
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function EmbedPost( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'embed-post', className, ariaPressed );
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
			<Path d="M17 4H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM8.6 9l-.4.3c-.4.4-.5 1.1-.2 1.6l-.8.8-1.1-1.1-1.3 1.3c-.2.2-1.6 1.3-1.8 1.1-.2-.2.9-1.6 1.1-1.8l1.3-1.3-1.1-1.1.8-.8c.5.3 1.2.3 1.6-.2l.3-.3c.5-.5.5-1.2.2-1.7L8 5l3 2.9-.8.8c-.5-.2-1.2-.2-1.6.3zm5.4 1.5L12.5 12l1.5 1.5V15l-3-3 3-3v1.5zm1 4.5v-1.5l1.5-1.5-1.5-1.5V9l3 3-3 3z" />
		</SVG>
	);
}
