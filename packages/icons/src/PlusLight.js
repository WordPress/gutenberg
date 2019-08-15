
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function PlusLight( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'plus-light', className, ariaPressed );
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
			<Path d="M17 9v2h-6v6H9v-6H3V9h6V3h2v6h6z" />
		</SVG>
	);
}
