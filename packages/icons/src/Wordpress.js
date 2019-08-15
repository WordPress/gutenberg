
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Wordpress( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'wordpress', className, ariaPressed );
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
			<Path d="M20 10c0-5.52-4.48-10-10-10S0 4.48 0 10s4.48 10 10 10 10-4.48 10-10zM10 1.01c4.97 0 8.99 4.02 8.99 8.99s-4.02 8.99-8.99 8.99S1.01 14.97 1.01 10 5.03 1.01 10 1.01zM8.01 14.82L4.96 6.61c.49-.03 1.05-.08 1.05-.08.43-.05.38-1.01-.06-.99 0 0-1.29.1-2.13.1-.15 0-.33 0-.52-.01 1.44-2.17 3.9-3.6 6.7-3.6 2.09 0 3.99.79 5.41 2.09-.6-.08-1.45.35-1.45 1.42 0 .66.38 1.22.79 1.88.31.54.5 1.22.5 2.21 0 1.34-1.27 4.48-1.27 4.48l-2.71-7.5c.48-.03.75-.16.75-.16.43-.05.38-1.1-.05-1.08 0 0-1.3.11-2.14.11-.78 0-2.11-.11-2.11-.11-.43-.02-.48 1.06-.05 1.08l.84.08 1.12 3.04zm6.02 2.15L16.64 10s.67-1.69.39-3.81c.63 1.14.94 2.42.94 3.81 0 2.96-1.56 5.58-3.94 6.97zM2.68 6.77L6.5 17.25c-2.67-1.3-4.47-4.08-4.47-7.25 0-1.16.2-2.23.65-3.23zm7.45 4.53l2.29 6.25c-.75.27-1.57.42-2.42.42-.72 0-1.41-.11-2.06-.3z" />
		</SVG>
	);
}
