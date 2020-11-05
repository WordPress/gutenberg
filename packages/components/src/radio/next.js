/**
 * WordPress dependencies
 */
import { Radio } from '@wordpress/ui.components';
import { withNextComponent as withNext } from '@wordpress/ui.context';

export function withNextComponent( current ) {
	return withNext( current, Radio, 'WPComponentsRadio' );
}
