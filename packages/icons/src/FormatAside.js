
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function FormatAside( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'format-aside', className, ariaPressed );
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
			<Path d="M1 1h18v12l-6 6H1V1zm3 3v1h12V4H4zm0 4v1h12V8H4zm6 5v-1H4v1h6zm2 4l5-5h-5v5z" />
		</SVG>
	);
}
