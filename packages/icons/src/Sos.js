
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Sos( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'sos', className, ariaPressed );
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
			<Path d="M18 10c0-4.42-3.58-8-8-8s-8 3.58-8 8 3.58 8 8 8 8-3.58 8-8zM7.23 3.57L8.72 7.3c-.62.29-1.13.8-1.42 1.42L3.57 7.23c.71-1.64 2.02-2.95 3.66-3.66zm9.2 3.66L12.7 8.72c-.29-.62-.8-1.13-1.42-1.42l1.49-3.73c1.64.71 2.95 2.02 3.66 3.66zM10 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-6.43.77l3.73-1.49c.29.62.8 1.13 1.42 1.42l-1.49 3.73c-1.64-.71-2.95-2.02-3.66-3.66zm9.2 3.66l-1.49-3.73c.62-.29 1.13-.8 1.42-1.42l3.73 1.49c-.71 1.64-2.02 2.95-3.66 3.66z" />
		</SVG>
	);
}
