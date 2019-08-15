
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function ShareAlt2( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'share-alt-2', className, ariaPressed );
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
			<Path d="M18 8l-5 4V9.01c-2.58.06-4.88.45-7 2.99.29-3.57 2.66-5.66 7-5.94V3zM4 14h11v-2l2-1.6V16H2V5h9.43c-1.83.32-3.31 1-4.41 2H4v7z" />
		</SVG>
	);
}
