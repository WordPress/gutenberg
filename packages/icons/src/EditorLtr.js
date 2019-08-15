
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function EditorLtr( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-ltr', className, ariaPressed );
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
			<Path d="M5.52 2h7.43c.55 0 1 .45 1 1s-.45 1-1 1h-1v13c0 .55-.45 1-1 1s-1-.45-1-1V5c0-.55-.45-1-1-1s-1 .45-1 1v12c0 .55-.45 1-1 1s-1-.45-1-1v-5.96h-.43C3.02 11.04 1 9.02 1 6.52S3.02 2 5.52 2zM14 14l5-4-5-4v8z" />
		</SVG>
	);
}
