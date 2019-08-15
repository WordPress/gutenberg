
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function MediaSpreadsheet( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'media-spreadsheet', className, ariaPressed );
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
			<Path d="M12 2l4 4v12H4V2h8zm-1 4V3H5v3h6zM8 8V7H5v1h3zm3 0V7H9v1h2zm4 0V7h-3v1h3zm-7 2V9H5v1h3zm3 0V9H9v1h2zm4 0V9h-3v1h3zm-7 2v-1H5v1h3zm3 0v-1H9v1h2zm4 0v-1h-3v1h3zm-7 2v-1H5v1h3zm3 0v-1H9v1h2zm4 0v-1h-3v1h3zm-7 2v-1H5v1h3zm3 0v-1H9v1h2z" />
		</SVG>
	);
}
