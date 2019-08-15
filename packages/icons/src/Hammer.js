
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Hammer( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'hammer', className, ariaPressed );
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
			<Path d="M17.7 6.32l1.41 1.42-3.47 3.41-1.42-1.42.84-.82c-.32-.76-.81-1.57-1.51-2.31l-4.61 6.59-5.26 4.7c-.39.39-1.02.39-1.42 0l-1.2-1.21c-.39-.39-.39-1.02 0-1.41l10.97-9.92c-1.37-.86-3.21-1.46-5.67-1.48 2.7-.82 4.95-.93 6.58-.3 1.7.66 2.82 2.2 3.91 3.58z" />
		</SVG>
	);
}
