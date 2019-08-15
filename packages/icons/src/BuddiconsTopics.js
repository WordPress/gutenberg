
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function BuddiconsTopics( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'buddicons-topics', className, ariaPressed );
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
			<Path d="M10.44 1.66c-.59-.58-1.54-.58-2.12 0L2.66 7.32c-.58.58-.58 1.53 0 2.12.6.6 1.56.56 2.12 0l5.66-5.66c.58-.58.59-1.53 0-2.12zm2.83 2.83c-.59-.59-1.54-.59-2.12 0l-5.66 5.66c-.59.58-.59 1.53 0 2.12.6.6 1.56.55 2.12 0l5.66-5.66c.58-.58.58-1.53 0-2.12zm1.06 6.72l4.18 4.18c.59.58.59 1.53 0 2.12s-1.54.59-2.12 0l-4.18-4.18-1.77 1.77c-.59.58-1.54.58-2.12 0-.59-.59-.59-1.54 0-2.13l5.66-5.65c.58-.59 1.53-.59 2.12 0 .58.58.58 1.53 0 2.12zM5 15c0-1.59-1.66-4-1.66-4S2 13.78 2 15s.6 2 1.34 2h.32C4.4 17 5 16.59 5 15z" />
		</SVG>
	);
}
