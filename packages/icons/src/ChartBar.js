
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function ChartBar( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'chart-bar', className, ariaPressed );
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
			<Path d="M18 18V2h-4v16h4zm-6 0V7H8v11h4zm-6 0v-8H2v8h4z" />
		</SVG>
	);
}
