
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function ThumbsUp( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'thumbs-up', className, ariaPressed );
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
			<Path d="M12.72 2c.15-.02.26.02.41.07.56.19.83.79.66 1.35-.17.55-1 3.04-1 3.58 0 .53.75 1 1.35 1h3c.6 0 1 .4 1 1s-2 7-2 7c-.17.39-.55 1-1 1H6V8h2.14c.41-.41 3.3-4.71 3.58-5.27.21-.41.6-.68 1-.73zM2 8h2v9H2V8z" />
		</SVG>
	);
}
