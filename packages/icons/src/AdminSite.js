
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function AdminSite( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'admin-site', className, ariaPressed );
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
			<Path d="M9 0C4.03 0 0 4.03 0 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm3.46 11.95c0 1.47-.8 3.3-4.06 4.7.3-4.17-2.52-3.69-3.2-5 .126-1.1.804-2.063 1.8-2.55-1.552-.266-3-.96-4.18-2 .05.47.28.904.64 1.21-.782-.295-1.458-.817-1.94-1.5.977-3.225 3.883-5.482 7.25-5.63-.84 1.38-1.5 4.13 0 5.57C7.23 7 6.26 5 5.41 5.79c-1.13 1.06.33 2.51 3.42 3.08 3.29.59 3.66 1.58 3.63 3.08zm1.34-4c-.32-1.11.62-2.23 1.69-3.14 1.356 1.955 1.67 4.45.84 6.68-.77-1.89-2.17-2.32-2.53-3.57v.03z" />
		</SVG>
	);
}
