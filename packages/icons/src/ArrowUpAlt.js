
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ArrowUpAlt( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'arrow-up-alt', className, ariaPressed );
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
			<Path d="M11 18H9V6l-4 4-2-1 7-7 7 7-2 1-4-4v12z" />
		</SVG>
	);
}
