
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Hidden( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'hidden', className, ariaPressed );
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
			<Path d="M17.2 3.3l.16.17c.39.39.39 1.02 0 1.41L4.55 17.7c-.39.39-1.03.39-1.41 0l-.17-.17c-.39-.39-.39-1.02 0-1.41l1.59-1.6c-1.57-1-2.76-2.3-3.56-3.93.81-1.65 2.03-2.98 3.64-3.99S8.04 5.09 10 5.09c1.2 0 2.33.21 3.4.6l2.38-2.39c.39-.39 1.03-.39 1.42 0zm-7.09 4.01c-.23.25-.34.54-.34.88 0 .31.12.58.31.81l1.8-1.79c-.13-.12-.28-.21-.45-.26-.11-.01-.28-.03-.49-.04-.33.03-.6.16-.83.4zM2.4 10.59c.69 1.23 1.71 2.25 3.05 3.05l1.28-1.28c-.51-.69-.77-1.47-.77-2.36 0-1.06.36-1.98 1.09-2.76-1.04.27-1.96.7-2.76 1.26-.8.58-1.43 1.27-1.89 2.09zm13.22-2.13l.96-.96c1.02.86 1.83 1.89 2.42 3.09-.81 1.65-2.03 2.98-3.64 3.99s-3.4 1.51-5.36 1.51c-.63 0-1.24-.07-1.83-.18l1.07-1.07c.25.02.5.05.76.05 1.63 0 3.13-.4 4.5-1.21s2.4-1.84 3.1-3.09c-.46-.82-1.09-1.51-1.89-2.09-.03-.01-.06-.03-.09-.04zm-5.58 5.58l4-4c-.01 1.1-.41 2.04-1.18 2.81-.78.78-1.72 1.18-2.82 1.19z" />
		</SVG>
	);
}
