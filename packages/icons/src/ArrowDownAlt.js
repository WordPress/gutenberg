
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function ArrowDownAlt( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'arrow-down-alt', className, ariaPressed );
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
			<Path d="M9 2h2v12l4-4 2 1-7 7-7-7 2-1 4 4V2z" />
		</SVG>
	);
}
