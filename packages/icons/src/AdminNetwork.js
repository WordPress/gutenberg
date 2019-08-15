
/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

export default function AdminNetwork( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'admin-network', className, ariaPressed );
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
			<Path d="M16.95 2.58c1.96 1.95 1.96 5.12 0 7.07-1.51 1.51-3.75 1.84-5.59 1.01l-1.87 3.31-2.99.31L5 18H2l-1-2 7.95-7.69c-.92-1.87-.62-4.18.93-5.73 1.95-1.96 5.12-1.96 7.07 0zm-2.51 3.79c.74 0 1.33-.6 1.33-1.34 0-.73-.59-1.33-1.33-1.33-.73 0-1.33.6-1.33 1.33 0 .74.6 1.34 1.33 1.34z" />
		</SVG>
	);
}
