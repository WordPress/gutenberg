
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Heart( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'heart', className, ariaPressed );
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
			<Path d="M10 17.12c3.33-1.4 5.74-3.79 7.04-6.21 1.28-2.41 1.46-4.81.32-6.25-1.03-1.29-2.37-1.78-3.73-1.74s-2.68.63-3.63 1.46c-.95-.83-2.27-1.42-3.63-1.46s-2.7.45-3.73 1.74c-1.14 1.44-.96 3.84.34 6.25 1.28 2.42 3.69 4.81 7.02 6.21z" />
		</SVG>
	);
}
