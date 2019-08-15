
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Download( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'download', className, ariaPressed );
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
			<Path d="M14.01 4v6h2V2H4v8h2.01V4h8zm-2 2v6h3l-5 6-5-6h3V6h4z" />
		</SVG>
	);
}
