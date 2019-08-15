
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Vault( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'vault', className, ariaPressed );
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
			<Path d="M18 17V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h14c.55 0 1-.45 1-1zm-1 0H3V3h14v14zM4.75 4h10.5c.41 0 .75.34.75.75V6h-1v3h1v2h-1v3h1v1.25c0 .41-.34.75-.75.75H4.75c-.41 0-.75-.34-.75-.75V4.75c0-.41.34-.75.75-.75zM13 10c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zM9 7l.77 1.15C10.49 8.46 11 9.17 11 10c0 1.1-.9 2-2 2s-2-.9-2-2c0-.83.51-1.54 1.23-1.85z" />
		</SVG>
	);
}
