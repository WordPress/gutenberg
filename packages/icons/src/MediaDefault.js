
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function MediaDefault( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'media-default', className, ariaPressed );
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
			<Path d="M12 2l4 4v12H4V2h8zm0 4h3l-3-3v3z" />
		</SVG>
	);
}
