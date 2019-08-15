
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Googleplus( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'googleplus', className, ariaPressed );
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
			<Path d="M6.73 10h5.4c.05.29.09.57.09.95 0 3.27-2.19 5.6-5.49 5.6-3.17 0-5.73-2.57-5.73-5.73 0-3.17 2.56-5.73 5.73-5.73 1.54 0 2.84.57 3.83 1.5l-1.55 1.5c-.43-.41-1.17-.89-2.28-.89-1.96 0-3.55 1.62-3.55 3.62 0 1.99 1.59 3.61 3.55 3.61 2.26 0 3.11-1.62 3.24-2.47H6.73V10zM19 10v1.64h-1.64v1.63h-1.63v-1.63h-1.64V10h1.64V8.36h1.63V10H19z" />
		</SVG>
	);
}
