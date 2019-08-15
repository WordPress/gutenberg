
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Desktop( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'desktop', className, ariaPressed );
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
			<Path d="M3 2h14c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1h-5v2h2c.55 0 1 .45 1 1v1H5v-1c0-.55.45-1 1-1h2v-2H3c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1zm13 9V4H4v7h12zM5 5h9L5 9V5z" />
		</SVG>
	);
}
