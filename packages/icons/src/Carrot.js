
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Carrot( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'carrot', className, ariaPressed );
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
			<Path d="M2 18.43c1.51 1.36 11.64-4.67 13.14-7.21.72-1.22-.13-3.01-1.52-4.44C15.2 5.73 16.59 9 17.91 8.31c.6-.32.99-1.31.7-1.92-.52-1.08-2.25-1.08-3.42-1.21.83-.2 2.82-1.05 2.86-2.25.04-.92-1.13-1.97-2.05-1.86-1.21.14-1.65 1.88-2.06 3-.05-.71-.2-2.27-.98-2.95-1.04-.91-2.29-.05-2.32 1.05-.04 1.33 2.82 2.07 1.92 3.67C11.04 4.67 9.25 4.03 8.1 4.7c-.49.31-1.05.91-1.63 1.69.89.94 2.12 2.07 3.09 2.72.2.14.26.42.11.62-.14.21-.42.26-.62.12-.99-.67-2.2-1.78-3.1-2.71-.45.67-.91 1.43-1.34 2.23.85.86 1.93 1.83 2.79 2.41.2.14.25.42.11.62-.14.21-.42.26-.63.12-.85-.58-1.86-1.48-2.71-2.32C2.4 13.69 1.1 17.63 2 18.43z" />
		</SVG>
	);
}
