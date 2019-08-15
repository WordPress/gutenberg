
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function EditorBreak( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-break', className, ariaPressed );
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
			<Path d="M16 4h2v9H7v3l-5-4 5-4v3h9V4z" />
		</SVG>
	);
}
