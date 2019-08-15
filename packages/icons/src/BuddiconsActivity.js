
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function BuddiconsActivity( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'buddicons-activity', className, ariaPressed );
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
			<Path d="M8 1v7h2V6c0-1.52 1.45-3 3-3v.86c.55-.52 1.26-.86 2-.86v3h1c1.1 0 2 .9 2 2s-.9 2-2 2h-1v6c0 .55-.45 1-1 1s-1-.45-1-1v-2.18c-.31.11-.65.18-1 .18v2c0 .55-.45 1-1 1s-1-.45-1-1v-2H8v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c-.35 0-.69-.07-1-.18V16c0 .55-.45 1-1 1s-1-.45-1-1v-4H2v-1c0-1.66 1.34-3 3-3h2V1h1zm5 7c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z" />
		</SVG>
	);
}
