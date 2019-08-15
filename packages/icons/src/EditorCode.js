
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function EditorCode( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-code', className, ariaPressed );
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
			<Path d="M9 6l-4 4 4 4-1 2-6-6 6-6zm2 8l4-4-4-4 1-2 6 6-6 6z" />
		</SVG>
	);
}
