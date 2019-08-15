
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function PlusAlt( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'plus-alt', className, ariaPressed );
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
			<Path d="M15.8 4.2c3.2 3.21 3.2 8.39 0 11.6-3.21 3.2-8.39 3.2-11.6 0C1 12.59 1 7.41 4.2 4.2 7.41 1 12.59 1 15.8 4.2zm-4.3 11.3v-4h4v-3h-4v-4h-3v4h-4v3h4v4h3z" />
		</SVG>
	);
}
