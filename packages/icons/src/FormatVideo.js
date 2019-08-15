
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function FormatVideo( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'format-video', className, ariaPressed );
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
			<Path d="M2 1h16c.55 0 1 .45 1 1v16l-18-.02V2c0-.55.45-1 1-1zm4 1L4 5h1l2-3H6zm4 0H9L7 5h1zm3 0h-1l-2 3h1zm3 0h-1l-2 3h1zm1 14V6H3v10h14zM8 7l6 4-6 4V7z" />
		</SVG>
	);
}
