
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function EmailAlt2( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'email-alt-2', className, ariaPressed );
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
			<Path d="M18.01 11.18V2.51c0-1.19-.9-1.81-2-1.37L4 5.91c-1.1.44-2 1.77-2 2.97v8.66c0 1.2.9 1.81 2 1.37l12.01-4.77c1.1-.44 2-1.76 2-2.96zm-1.43-7.46l-6.04 9.33-6.65-4.6c-.1-.07-.36-.32-.17-.64.21-.36.65-.21.65-.21l6.3 2.32s4.83-6.34 5.11-6.7c.13-.17.43-.34.73-.13.29.2.16.49.07.63z" />
		</SVG>
	);
}
