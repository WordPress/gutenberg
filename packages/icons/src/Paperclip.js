
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function Paperclip( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'paperclip', className, ariaPressed );
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
			<Path d="M17.05 2.7c1.93 1.94 1.93 5.13 0 7.07L10 16.84c-1.88 1.89-4.91 1.93-6.86.15-.06-.05-.13-.09-.19-.15-1.93-1.94-1.93-5.12 0-7.07l4.94-4.95c.91-.92 2.28-1.1 3.39-.58.3.15.59.33.83.58 1.17 1.17 1.17 3.07 0 4.24l-4.93 4.95c-.39.39-1.02.39-1.41 0s-.39-1.02 0-1.41l4.93-4.95c.39-.39.39-1.02 0-1.41-.38-.39-1.02-.39-1.4 0l-4.94 4.95c-.91.92-1.1 2.29-.57 3.4.14.3.32.59.57.84s.54.43.84.57c1.11.53 2.47.35 3.39-.57l7.05-7.07c1.16-1.17 1.16-3.08 0-4.25-.56-.55-1.28-.83-2-.86-.08.01-.16.01-.24 0-.22-.03-.43-.11-.6-.27-.39-.4-.38-1.05.02-1.45.16-.16.36-.24.56-.28.14-.02.27-.01.4.02 1.19.06 2.36.52 3.27 1.43z" />
		</SVG>
	);
}
