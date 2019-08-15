
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function EditorContract( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-contract', className, ariaPressed );
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
			<Path d="M15.75 6.75L18 3v14l-2.25-3.75L17 12h-4v4l1.25-1.25L18 17H2l3.75-2.25L7 16v-4H3l1.25 1.25L2 17V3l2.25 3.75L3 8h4V4L5.75 5.25 2 3h16l-3.75 2.25L13 4v4h4z" />
		</SVG>
	);
}
