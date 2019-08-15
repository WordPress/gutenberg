
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Smiley( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'smiley', className, ariaPressed );
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
			<Path d="M7 5.2c1.1 0 2 .89 2 2 0 .37-.11.71-.28 1C8.72 8.2 8 8 7 8s-1.72.2-1.72.2c-.17-.29-.28-.63-.28-1 0-1.11.9-2 2-2zm6 0c1.11 0 2 .89 2 2 0 .37-.11.71-.28 1 0 0-.72-.2-1.72-.2s-1.72.2-1.72.2c-.17-.29-.28-.63-.28-1 0-1.11.89-2 2-2zm-3 13.7c3.72 0 7.03-2.36 8.23-5.88l-1.32-.46C15.9 15.52 13.12 17.5 10 17.5s-5.9-1.98-6.91-4.94l-1.32.46c1.2 3.52 4.51 5.88 8.23 5.88z" />
		</SVG>
	);
}
