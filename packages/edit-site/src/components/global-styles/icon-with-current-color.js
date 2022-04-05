/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

export function IconWithCurrentColor( { className, ...props } ) {
	return (
		<Icon
			className={ `${ className } edit-site-global-styles-icon-with-current-color` }
			{ ...props }
		/>
	);
}
