
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function AdminCollapse( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'admin-collapse', className, ariaPressed );
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
			<Path d="M10 2.16c4.33 0 7.84 3.51 7.84 7.84s-3.51 7.84-7.84 7.84S2.16 14.33 2.16 10 5.71 2.16 10 2.16zm2 11.72V6.12L6.18 9.97z" />
		</SVG>
	);
}
