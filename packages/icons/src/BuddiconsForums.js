
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function BuddiconsForums( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'buddicons-forums', className, ariaPressed );
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
			<Path d="M13.5 7h-7C5.67 7 5 6.33 5 5.5S5.67 4 6.5 4h1.59C8.04 3.84 8 3.68 8 3.5 8 2.67 8.67 2 9.5 2h1c.83 0 1.5.67 1.5 1.5 0 .18-.04.34-.09.5h1.59c.83 0 1.5.67 1.5 1.5S14.33 7 13.5 7zM4 8h12c.55 0 1 .45 1 1s-.45 1-1 1H4c-.55 0-1-.45-1-1s.45-1 1-1zm1 3h10c.55 0 1 .45 1 1s-.45 1-1 1H5c-.55 0-1-.45-1-1s.45-1 1-1zm2 3h6c.55 0 1 .45 1 1s-.45 1-1 1h-1.09c.05.16.09.32.09.5 0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5 0-.18.04-.34.09-.5H7c-.55 0-1-.45-1-1s.45-1 1-1z" />
		</SVG>
	);
}
