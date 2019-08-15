
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function MediaInteractive( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'media-interactive', className, ariaPressed );
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
			<Path d="M12 2l4 4v12H4V2h8zm0 4h3l-3-3v3zm2 8V8H6v6h3l-1 2h1l1-2 1 2h1l-1-2h3zm-6-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-2v2h-3V9h3zm0 3v1H7v-1h6z" />
		</SVG>
	);
}
