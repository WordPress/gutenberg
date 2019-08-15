
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Sticky( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'sticky', className, ariaPressed );
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
			<Path d="M5 3.61V1.04l8.99-.01-.01 2.58c-1.22.26-2.16 1.35-2.16 2.67v.5c.01 1.31.93 2.4 2.17 2.66l-.01 2.58h-3.41l-.01 2.57c0 .6-.47 4.41-1.06 4.41-.6 0-1.08-3.81-1.08-4.41v-2.56L5 12.02l.01-2.58c1.23-.25 2.15-1.35 2.15-2.66v-.5c0-1.31-.92-2.41-2.16-2.67z" />
		</SVG>
	);
}
