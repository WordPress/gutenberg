
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ImageFlipVertical( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'image-flip-vertical', className, ariaPressed );
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
			<Path d="M20 9v2h-3v8H3v-8H0V9h3V1h14v8h3zM6.5 7h7L10 3zM17 9.5H3v1h14v-1zM13.5 13h-7l3.5 4z" />
		</SVG>
	);
}
