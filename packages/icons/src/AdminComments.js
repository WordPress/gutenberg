
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function AdminComments( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'admin-comments', className, ariaPressed );
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
			<Path d="M5 2h9c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2h-2l-5 5v-5H5c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2z" />
		</SVG>
	);
}
