
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Album( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'album', className, ariaPressed );
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
			<Path d="M0 18h10v-.26c1.52.4 3.17.35 4.76-.24 4.14-1.52 6.27-6.12 4.75-10.26-1.43-3.89-5.58-6-9.51-4.98V2H0v16zM9 3v14H1V3h8zm5.45 8.22c-.68 1.35-2.32 1.9-3.67 1.23-.31-.15-.57-.35-.78-.59V8.13c.8-.86 2.11-1.13 3.22-.58 1.35.68 1.9 2.32 1.23 3.67zm-2.75-.82c.22.16.53.12.7-.1.16-.22.12-.53-.1-.7s-.53-.12-.7.1c-.16.21-.12.53.1.7zm3.01 3.67c-1.17.78-2.56.99-3.83.69-.27-.06-.44-.34-.37-.61s.34-.43.62-.36l.17.04c.96.17 1.98-.01 2.86-.59.47-.32.86-.72 1.14-1.18.15-.23.45-.3.69-.16.23.15.3.46.16.69-.36.57-.84 1.08-1.44 1.48zm1.05 1.57c-1.48.99-3.21 1.32-4.84 1.06-.28-.05-.47-.32-.41-.6.05-.27.32-.45.61-.39l.22.04c1.31.15 2.68-.14 3.87-.94.71-.47 1.27-1.07 1.7-1.74.14-.24.45-.31.68-.16.24.14.31.45.16.69-.49.79-1.16 1.49-1.99 2.04z" />
		</SVG>
	);
}
