
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Share( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'share', className, ariaPressed );
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
			<Path d="M14.5 12c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3c0-.24.03-.46.09-.69l-4.38-2.3c-.55.61-1.33.99-2.21.99-1.66 0-3-1.34-3-3s1.34-3 3-3c.88 0 1.66.39 2.21.99l4.38-2.3c-.06-.23-.09-.45-.09-.69 0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3c-.88 0-1.66-.39-2.21-.99l-4.38 2.3c.06.23.09.45.09.69s-.03.46-.09.69l4.38 2.3c.55-.61 1.33-.99 2.21-.99z" />
		</SVG>
	);
}
