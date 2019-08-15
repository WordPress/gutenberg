
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Randomize( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'randomize', className, ariaPressed );
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
			<Path d="M18 6.01L14 9V7h-4l-5 8H2v-2h2l5-8h5V3zM2 5h3l1.15 2.17-1.12 1.8L4 7H2V5zm16 9.01L14 17v-2H9l-1.15-2.17 1.12-1.8L10 13h4v-2z" />
		</SVG>
	);
}
