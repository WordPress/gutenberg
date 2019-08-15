
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Tide( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'tide', className, ariaPressed );
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
			<Path d="M17 7.2V3H3v7.1c2.6-.5 4.5-1.5 6.4-2.6.2-.2.4-.3.6-.5v3c-1.9 1.1-4 2.2-7 2.8V17h14V9.9c-2.6.5-4.4 1.5-6.2 2.6-.3.1-.5.3-.8.4V10c2-1.1 4-2.2 7-2.8z" />
		</SVG>
	);
}
