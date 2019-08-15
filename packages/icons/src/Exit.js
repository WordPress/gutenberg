
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Exit( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'exit', className, ariaPressed );
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
			<Path d="M13 3v2h2v10h-2v2h4V3h-4zm0 8V9H5.4l4.3-4.3-1.4-1.4L1.6 10l6.7 6.7 1.4-1.4L5.4 11H13z" />
		</SVG>
	);
}
