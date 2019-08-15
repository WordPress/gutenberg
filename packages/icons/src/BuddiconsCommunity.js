
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function BuddiconsCommunity( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'buddicons-community', className, ariaPressed );
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
			<Path d="M9 3c0-.67-.47-1.43-1-2-.5.5-1 1.38-1 2 0 .48.45 1 1 1s1-.47 1-1zm4 0c0-.67-.47-1.43-1-2-.5.5-1 1.38-1 2 0 .48.45 1 1 1s1-.47 1-1zM9 9V5.5c0-.55-.45-1-1-1-.57 0-1 .49-1 1V9c0 .55.45 1 1 1 .57 0 1-.49 1-1zm4 0V5.5c0-.55-.45-1-1-1-.57 0-1 .49-1 1V9c0 .55.45 1 1 1 .57 0 1-.49 1-1zm4 1c0-1.48-1.41-2.77-3.5-3.46V9c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V6.01c-.17 0-.33-.01-.5-.01s-.33.01-.5.01V9c0 .83-.67 1.5-1.5 1.5S6.5 9.83 6.5 9V6.54C4.41 7.23 3 8.52 3 10c0 1.41.95 2.65 3.21 3.37 1.11.35 2.39 1.12 3.79 1.12s2.69-.78 3.79-1.13C16.04 12.65 17 11.41 17 10zm-7 5.43c1.43 0 2.74-.79 3.88-1.11 1.9-.53 2.49-1.34 3.12-2.32v3c0 2.21-3.13 4-7 4s-7-1.79-7-4v-3c.64.99 1.32 1.8 3.15 2.33 1.13.33 2.44 1.1 3.85 1.1z" />
		</SVG>
	);
}
