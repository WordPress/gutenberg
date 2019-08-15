
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function MediaText( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'media-text', className, ariaPressed );
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
			<Path d="M12 2l4 4v12H4V2h8zM5 3v1h6V3H5zm7 3h3l-3-3v3zM5 5v1h6V5H5zm10 3V7H5v1h10zm0 2V9H5v1h10zm0 2v-1H5v1h10zm-4 2v-1H5v1h6z" />
		</SVG>
	);
}
