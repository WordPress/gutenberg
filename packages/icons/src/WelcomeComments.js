
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function WelcomeComments( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'welcome-comments', className, ariaPressed );
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
			<Path d="M5 2h10c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-2l-5 5v-5H5c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm8.5 8.5L11 8l2.5-2.5-1-1L10 7 7.5 4.5l-1 1L9 8l-2.5 2.5 1 1L10 9l2.5 2.5z" />
		</SVG>
	);
}
