/**
 * WordPress dependencies
 */
import { NavigableMenu } from '@wordpress/components';

function NavigableToolbar( { children, ...props } ) {
	return (
		<NavigableMenu
			orientation="horizontal"
			role="toolbar"
			{ ...props }
		>
			{ children }
		</NavigableMenu>
	);
}

export default NavigableToolbar;
