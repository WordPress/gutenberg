
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function AdminSiteAlt2( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'admin-site-alt-2', className, ariaPressed );
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
			<Path d="M9 0C4.03 0 0 4.03 0 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm2.92 12.34c0 .35.14.63.36.66.22.03.47-.22.58-.6l.2.08c.718.384 1.07 1.22.84 2-.15.69-.743 1.198-1.45 1.24-.49-1.21-2.11.06-3.56-.22-.612-.154-1.11-.6-1.33-1.19 1.19-.11 2.85-1.73 4.36-1.97zM8 11.27c.918 0 1.695-.68 1.82-1.59.44.54.41 1.324-.07 1.83-.255.223-.594.325-.93.28-.335-.047-.635-.236-.82-.52zm3-.76c.41.39 3-.06 3.52 1.09-.95-.2-2.95.61-3.47-1.08l-.05-.01zM9.73 5.45v.27c-.65-.77-1.33-1.07-1.61-.57-.28.5 1 1.11.76 1.88-.24.77-1.27.56-1.88 1.61-.61 1.05-.49 2.42 1.24 3.67-1.192-.132-2.19-.962-2.54-2.11-.4-1.2-.09-2.26-.78-2.46C4 7.46 3 8.71 3 9.8c-1.26-1.26.05-2.86-1.2-4.18C3.5 1.998 7.644.223 11.44 1.49c-1.1 1.02-1.722 2.458-1.71 3.96z" />
		</SVG>
	);
}
