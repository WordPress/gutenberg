
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function CalendarAlt( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'calendar-alt', className, ariaPressed );
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
			<Path d="M15 4h3v15H2V4h3V3c0-.41.15-.76.44-1.06.29-.29.65-.44 1.06-.44s.77.15 1.06.44c.29.3.44.65.44 1.06v1h4V3c0-.41.15-.76.44-1.06.29-.29.65-.44 1.06-.44s.77.15 1.06.44c.29.3.44.65.44 1.06v1zM6 3v2.5c0 .14.05.26.15.36.09.09.21.14.35.14s.26-.05.35-.14c.1-.1.15-.22.15-.36V3c0-.14-.05-.26-.15-.35-.09-.1-.21-.15-.35-.15s-.26.05-.35.15c-.1.09-.15.21-.15.35zm7 0v2.5c0 .14.05.26.14.36.1.09.22.14.36.14s.26-.05.36-.14c.09-.1.14-.22.14-.36V3c0-.14-.05-.26-.14-.35-.1-.1-.22-.15-.36-.15s-.26.05-.36.15c-.09.09-.14.21-.14.35zm4 15V8H3v10h14zM7 9v2H5V9h2zm2 0h2v2H9V9zm4 2V9h2v2h-2zm-6 1v2H5v-2h2zm2 0h2v2H9v-2zm4 2v-2h2v2h-2zm-6 1v2H5v-2h2zm4 2H9v-2h2v2zm4 0h-2v-2h2v2z" />
		</SVG>
	);
}
