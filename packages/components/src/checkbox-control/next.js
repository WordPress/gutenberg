/**
 * WordPress dependencies
 */
import { Checkbox } from '@wordpress/ui.components';
import { withNextComponent as withNext } from '@wordpress/ui.context';

export function withNextComponent( current ) {
	return withNext( current, Checkbox, 'WPComponentsCheckboxControl' );
}
