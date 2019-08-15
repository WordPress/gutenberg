
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Palmtree( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'palmtree', className, ariaPressed );
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
			<Path d="M8.58 2.39c.32 0 .59.05.81.14 1.25.55 1.69 2.24 1.7 3.97.59-.82 2.15-2.29 3.41-2.29s2.94.73 3.53 3.55c-1.13-.65-2.42-.94-3.65-.94-1.26 0-2.45.32-3.29.89.4-.11.86-.16 1.33-.16 1.39 0 2.9.45 3.4 1.31.68 1.16.47 3.38-.76 4.14-.14-2.1-1.69-4.12-3.47-4.12-.44 0-.88.12-1.33.38C8 10.62 7 14.56 7 19H2c0-5.53 4.21-9.65 7.68-10.79-.56-.09-1.17-.15-1.82-.15C6.1 8.06 4.05 8.5 2 10c.76-2.96 2.78-4.1 4.69-4.1 1.25 0 2.45.5 3.2 1.29-.66-2.24-2.49-2.86-4.08-2.86-.8 0-1.55.16-2.05.35.91-1.29 3.31-2.29 4.82-2.29zM13 11.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5z" />
		</SVG>
	);
}
