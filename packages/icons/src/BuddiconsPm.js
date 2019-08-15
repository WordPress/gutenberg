
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function BuddiconsPm( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'buddicons-pm', className, ariaPressed );
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
			<Path d="M10 2c3 0 8 5 8 5v11H2V7s5-5 8-5zm7 14.72l-3.73-2.92L17 11l-.43-.37-2.26 1.3.24-4.31-8.77-.52-.46 4.54-1.99-.95L3 11l3.73 2.8-3.44 2.85.4.43L10 13l6.53 4.15z" />
		</SVG>
	);
}
