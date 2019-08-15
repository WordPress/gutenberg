
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function EditorIndent( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-indent', className, ariaPressed );
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
			<Path d="M3 5V3h9v2H3zm10-1V3h4v1h-4zm0 3h2V5l4 3.5-4 3.5v-2h-2V7zM3 8V6h9v2H3zm2 3V9h7v2H5zm-2 3v-2h9v2H3zm10 0v-1h4v1h-4zm-4 3v-2h3v2H9z" />
		</SVG>
	);
}
