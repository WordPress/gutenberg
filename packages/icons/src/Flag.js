
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Flag( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'flag', className, ariaPressed );
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
			<Path d="M5 18V3H3v15h2zm1-6V4c3-1 7 1 11 0v8c-3 1.27-8-1-11 0z" />
		</SVG>
	);
}
