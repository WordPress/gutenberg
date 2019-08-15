
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function BuddiconsBbpressLogo( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'buddicons-bbpress-logo', className, ariaPressed );
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
			<Path d="M8.5 12.6c.3-1.3 0-2.3-1.1-2.3-.8 0-1.6.6-1.8 1.5l-.3 1.7c-.3 1 .3 1.5 1 1.5 1.2 0 1.9-1.1 2.2-2.4zm-4-6.4C3.7 7.3 3.3 8.6 3.3 10c0 1 .2 1.9.6 2.8l1-4.6c.3-1.7.4-2-.4-2zm9.3 6.4c.3-1.3 0-2.3-1.1-2.3-.8 0-1.6.6-1.8 1.5l-.4 1.7c-.2 1.1.4 1.6 1.1 1.6 1.1-.1 1.9-1.2 2.2-2.5zM10 3.3c-2 0-3.9.9-5.1 2.3.6-.1 1.4-.2 1.8-.3.2 0 .2.1.2.2 0 .2-1 4.8-1 4.8.5-.3 1.2-.7 1.8-.7.9 0 1.5.4 1.9.9l.5-2.4c.4-1.6.4-1.9-.4-1.9-.4 0-.4-.5 0-.6.6-.1 1.8-.2 2.3-.3.2 0 .2.1.2.2l-1 4.8c.5-.4 1.2-.7 1.9-.7 1.7 0 2.5 1.3 2.1 3-.3 1.7-2 3-3.8 3-1.3 0-2.1-.7-2.3-1.4-.7.8-1.7 1.3-2.8 1.4 1.1.7 2.4 1.1 3.7 1.1 3.7 0 6.7-3 6.7-6.7s-3-6.7-6.7-6.7zM10 2c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 15.5c-2.1 0-4-.8-5.3-2.2-.3-.4-.7-.8-1-1.2-.7-1.2-1.2-2.6-1.2-4.1 0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5-3.4 7.5-7.5 7.5z" />
		</SVG>
	);
}
