
/**
 * WordPress dependencies
 */
import { primitives } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getIconClassName } from '../icon-class';

const { Path, SVG } = primitives;

export default function BuddiconsGroups( { size = 20, className, ariaPressed, ...props } ) {
	const iconClass = getIconClassName( 'buddicons-groups', className, ariaPressed );
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
			<Path d="M15.45 6.25c1.83.94 1.98 3.18.7 4.98-.8 1.12-2.33 1.88-3.46 1.78L10.05 18H9l-2.65-4.99c-1.13.16-2.73-.63-3.55-1.79-1.28-1.8-1.13-4.04.71-4.97.48-.24.96-.33 1.43-.31-.01.4.01.8.07 1.21.26 1.69 1.41 3.53 2.86 4.37-.19.55-.49.99-.88 1.25L9 16.58v-5.66C7.64 10.55 6.26 8.76 6 7c-.4-2.65 1-5 3.5-5s3.9 2.35 3.5 5c-.26 1.76-1.64 3.55-3 3.92v5.77l2.07-3.84c-.44-.23-.77-.71-.99-1.3 1.48-.83 2.65-2.69 2.91-4.4.06-.41.08-.82.07-1.22.46-.01.92.08 1.39.32z" />
		</SVG>
	);
}
