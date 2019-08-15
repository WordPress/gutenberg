
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ArrowLeftAlt( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'arrow-left-alt', className, ariaPressed );
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
			<Path d="M18 9v2H6l4 4-1 2-7-7 7-7 1 2-4 4h12z" />
		</SVG>
	);
}
