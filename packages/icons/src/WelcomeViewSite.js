
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function WelcomeViewSite( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'welcome-view-site', className, ariaPressed );
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
			<Path d="M18 14V4c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h14c.55 0 1-.45 1-1zm-8-8c2.3 0 4.4 1.14 6 3-1.6 1.86-3.7 3-6 3s-4.4-1.14-6-3c1.6-1.86 3.7-3 6-3zm2 3c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm2 8h3v1H3v-1h3v-1h8v1z" />
		</SVG>
	);
}
