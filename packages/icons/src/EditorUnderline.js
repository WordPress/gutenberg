
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function EditorUnderline( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-underline', className, ariaPressed );
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
			<Path d="M14 5h-2v5.71c0 1.99-1.12 2.98-2.45 2.98-1.32 0-2.55-1-2.55-2.96V5H5v5.87c0 1.91 1 4.54 4.48 4.54 3.49 0 4.52-2.58 4.52-4.5V5zm0 13v-2H5v2h9z" />
		</SVG>
	);
}
