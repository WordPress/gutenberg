
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ImageCrop( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'image-crop', className, ariaPressed );
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
			<Path d="M19 12v3h-4v4h-3v-4H4V7H0V4h4V0h3v4h7l3-3 1 1-3 3v7h4zm-8-5H7v4zm-3 5h4V8z" />
		</SVG>
	);
}
