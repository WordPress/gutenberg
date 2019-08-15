
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function EditorVideo( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-video', className, ariaPressed );
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
			<Path d="M16 2h-3v1H7V2H4v15h3v-1h6v1h3V2zM6 3v1H5V3h1zm9 0v1h-1V3h1zm-2 1v5H7V4h6zM6 5v1H5V5h1zm9 0v1h-1V5h1zM6 7v1H5V7h1zm9 0v1h-1V7h1zM6 9v1H5V9h1zm9 0v1h-1V9h1zm-2 1v5H7v-5h6zm-7 1v1H5v-1h1zm9 0v1h-1v-1h1zm-9 2v1H5v-1h1zm9 0v1h-1v-1h1zm-9 2v1H5v-1h1zm9 0v1h-1v-1h1z" />
		</SVG>
	);
}
