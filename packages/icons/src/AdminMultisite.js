
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function AdminMultisite( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'admin-multisite', className, ariaPressed );
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
			<Path d="M14.27 6.87L10 3.14 5.73 6.87 5 6.14l5-4.38 5 4.38zM14 8.42l-4.05 3.43L6 8.38v-.74l4-3.5 4 3.5v.78zM11 9.7V8H9v1.7h2zm-1.73 4.03L5 10 .73 13.73 0 13l5-4.38L10 13zm10 0L15 10l-4.27 3.73L10 13l5-4.38L20 13zM5 11l4 3.5V18H1v-3.5zm10 0l4 3.5V18h-8v-3.5zm-9 6v-2H4v2h2zm10 0v-2h-2v2h2z" />
		</SVG>
	);
}
