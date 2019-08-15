
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function ChartArea( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'chart-area', className, ariaPressed );
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
			<Path d="M18 18l.01-12.28c.59-.35.99-.99.99-1.72 0-1.1-.9-2-2-2s-2 .9-2 2c0 .8.47 1.48 1.14 1.8l-4.13 6.58c-.33-.24-.73-.38-1.16-.38-.84 0-1.55.51-1.85 1.24l-2.14-1.53c.09-.22.14-.46.14-.71 0-1.11-.89-2-2-2-1.1 0-2 .89-2 2 0 .73.4 1.36.98 1.71L1 18h17zM17 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM5 10c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5.85 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
		</SVG>
	);
}
