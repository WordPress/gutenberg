
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function AlignPullLeft( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'align-pull-left', className, ariaPressed );
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
			<Path d="M9 16V4H3v12h6zm2-7h6V7h-6v2zm0 4h6v-2h-6v2z" />
		</SVG>
	);
}
