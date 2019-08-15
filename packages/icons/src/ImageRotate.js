
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ImageRotate( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'image-rotate', className, ariaPressed );
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
			<Path d="M10.25 1.02c5.1 0 8.75 4.04 8.75 9s-3.65 9-8.75 9c-3.2 0-6.02-1.59-7.68-3.99l2.59-1.52c1.1 1.5 2.86 2.51 4.84 2.51 3.3 0 6-2.79 6-6s-2.7-6-6-6c-1.97 0-3.72 1-4.82 2.49L7 8.02l-6 2v-7L2.89 4.6c1.69-2.17 4.36-3.58 7.36-3.58z" />
		</SVG>
	);
}
