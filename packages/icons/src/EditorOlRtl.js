
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function EditorOlRtl( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'editor-ol-rtl', className, ariaPressed );
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
			<Path d="M15.025 8.75a1.048 1.048 0 0 1 .45-.1.507.507 0 0 1 .35.11.455.455 0 0 1 .13.36.803.803 0 0 1-.06.3 1.448 1.448 0 0 1-.19.33c-.09.11-.29.32-.58.62l-.99 1v.58h2.76v-.7h-1.72v-.04l.51-.48a7.276 7.276 0 0 0 .7-.71 1.75 1.75 0 0 0 .3-.49 1.254 1.254 0 0 0 .1-.51.968.968 0 0 0-.16-.56 1.007 1.007 0 0 0-.44-.37 1.512 1.512 0 0 0-.65-.14 1.98 1.98 0 0 0-.51.06 1.9 1.9 0 0 0-.42.15 3.67 3.67 0 0 0-.48.35l.45.54a2.505 2.505 0 0 1 .45-.3zM16.695 15.29a1.29 1.29 0 0 0-.74-.3v-.02a1.203 1.203 0 0 0 .65-.37.973.973 0 0 0 .23-.65.81.81 0 0 0-.37-.71 1.72 1.72 0 0 0-1-.26 2.185 2.185 0 0 0-1.33.4l.4.6a1.79 1.79 0 0 1 .46-.23 1.18 1.18 0 0 1 .41-.07c.38 0 .58.15.58.46a.447.447 0 0 1-.22.43 1.543 1.543 0 0 1-.7.12h-.31v.66h.31a1.764 1.764 0 0 1 .75.12.433.433 0 0 1 .23.41.55.55 0 0 1-.2.47 1.084 1.084 0 0 1-.63.15 2.24 2.24 0 0 1-.57-.08 2.671 2.671 0 0 1-.52-.2v.74a2.923 2.923 0 0 0 1.18.22 1.948 1.948 0 0 0 1.22-.33 1.077 1.077 0 0 0 .43-.92.836.836 0 0 0-.26-.64zM15.005 4.17c.06-.05.16-.14.3-.28l-.02.42V7h.84V3h-.69l-1.29 1.03.4.51zM4.02 5h9v1h-9zM4.02 10h9v1h-9zM4.02 15h9v1h-9z" />
		</SVG>
	);
}
