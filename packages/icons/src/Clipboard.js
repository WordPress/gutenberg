
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function Clipboard( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'clipboard', className, ariaPressed );
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
			<Path d="M11.9.39l1.4 1.4c1.61.19 3.5-.74 4.61.37s.18 3 .37 4.61l1.4 1.4c.39.39.39 1.02 0 1.41l-9.19 9.2c-.4.39-1.03.39-1.42 0L1.29 11c-.39-.39-.39-1.02 0-1.42l9.2-9.19c.39-.39 1.02-.39 1.41 0zm.58 2.25l-.58.58 4.95 4.95.58-.58c-.19-.6-.2-1.22-.15-1.82.02-.31.05-.62.09-.92.12-1 .18-1.63-.17-1.98s-.98-.29-1.98-.17c-.3.04-.61.07-.92.09-.6.05-1.22.04-1.82-.15zm4.02.93c.39.39.39 1.03 0 1.42s-1.03.39-1.42 0-.39-1.03 0-1.42 1.03-.39 1.42 0zm-6.72.36l-.71.7L15.44 11l.7-.71zM8.36 5.34l-.7.71 6.36 6.36.71-.7zM6.95 6.76l-.71.7 6.37 6.37.7-.71zM5.54 8.17l-.71.71 6.36 6.36.71-.71zM4.12 9.58l-.71.71 6.37 6.37.71-.71z" />
		</SVG>
	);
}
