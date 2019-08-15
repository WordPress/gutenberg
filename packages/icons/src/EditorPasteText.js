
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function EditorPasteText( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-paste-text', className, ariaPressed );
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
			<Path d="M12.38 2L15 5v1H5V5l2.64-3h4.74zM10 5c.55 0 1-.44 1-1 0-.55-.45-1-1-1s-1 .45-1 1c0 .56.45 1 1 1zm5.45-1H17c.55 0 1 .45 1 1v12c0 .56-.45 1-1 1H3c-.55 0-1-.44-1-1V5c0-.55.45-1 1-1h1.55L4 4.63V7h12V4.63zM14 11V9H6v2h3v5h2v-5h3z" />
		</SVG>
	);
}
