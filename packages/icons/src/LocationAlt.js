
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function LocationAlt( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'location-alt', className, ariaPressed );
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
			<Path d="M13 13.14l1.17-5.94c.79-.43 1.33-1.25 1.33-2.2 0-1.38-1.12-2.5-2.5-2.5S10.5 3.62 10.5 5c0 .95.54 1.77 1.33 2.2zm0-9.64c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm1.72 4.8L18 6.97v9L13.12 18 7 15.97l-5 2v-9l5-2 4.27 1.41 1.73 7.3z" />
		</SVG>
	);
}
