
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function FormatStatus( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'format-status', className, ariaPressed );
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
			<Path d="M10 1c7 0 9 2.91 9 6.5S17 14 10 14s-9-2.91-9-6.5S3 1 10 1zM5.5 9C6.33 9 7 8.33 7 7.5S6.33 6 5.5 6 4 6.67 4 7.5 4.67 9 5.5 9zM10 9c.83 0 1.5-.67 1.5-1.5S10.83 6 10 6s-1.5.67-1.5 1.5S9.17 9 10 9zm4.5 0c.83 0 1.5-.67 1.5-1.5S15.33 6 14.5 6 13 6.67 13 7.5 13.67 9 14.5 9zM6 14.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-3 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
		</SVG>
	);
}
