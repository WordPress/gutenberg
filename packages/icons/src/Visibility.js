
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Visibility( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'visibility', className, ariaPressed );
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
			<Path d="M19.7 9.4C17.7 6 14 3.9 10 3.9S2.3 6 .3 9.4L0 10l.3.6c2 3.4 5.7 5.5 9.7 5.5s7.7-2.1 9.7-5.5l.3-.6-.3-.6zM10 14.1c-3.1 0-6-1.6-7.7-4.1C3.6 8 5.7 6.6 8 6.1c-.9.6-1.5 1.7-1.5 2.9 0 1.9 1.6 3.5 3.5 3.5s3.5-1.6 3.5-3.5c0-1.2-.6-2.3-1.5-2.9 2.3.5 4.4 1.9 5.7 3.9-1.7 2.5-4.6 4.1-7.7 4.1z" />
		</SVG>
	);
}
