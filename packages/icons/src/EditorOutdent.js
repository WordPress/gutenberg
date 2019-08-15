
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function EditorOutdent( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-outdent', className, ariaPressed );
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
			<Path d="M7 4V3H3v1h4zm10 1V3H8v2h9zM7 7H5V5L1 8.5 5 12v-2h2V7zm10 1V6H8v2h9zm-2 3V9H8v2h7zm2 3v-2H8v2h9zM7 14v-1H3v1h4zm4 3v-2H8v2h3z" />
		</SVG>
	);
}
