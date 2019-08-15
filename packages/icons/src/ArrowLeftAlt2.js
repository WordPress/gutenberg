
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function ArrowLeftAlt2( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'arrow-left-alt-2', className, ariaPressed );
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
			<Path d="M14 5l-5 5 5 5-1 2-7-7 7-7z" />
		</SVG>
	);
}
