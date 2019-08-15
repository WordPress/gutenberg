
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function BuddiconsTracking( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'buddicons-tracking', className, ariaPressed );
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
			<Path d="M10.98 6.78L15.5 15c-1 2-3.5 3-5.5 3s-4.5-1-5.5-3L9 6.82c-.75-1.23-2.28-1.98-4.29-2.03l2.46-2.92c1.68 1.19 2.46 2.32 2.97 3.31.56-.87 1.2-1.68 2.7-2.12l1.83 2.86c-1.42-.34-2.64.08-3.69.86zM8.17 10.4l-.93 1.69c.49.11 1 .16 1.54.16 1.35 0 2.58-.36 3.55-.95l-1.01-1.82c-.87.53-1.96.86-3.15.92zm.86 5.38c1.99 0 3.73-.74 4.74-1.86l-.98-1.76c-1 1.12-2.74 1.87-4.74 1.87-.62 0-1.21-.08-1.76-.21l-.63 1.15c.94.5 2.1.81 3.37.81z" />
		</SVG>
	);
}
