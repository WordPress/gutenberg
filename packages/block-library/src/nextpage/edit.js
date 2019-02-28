/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Separator } from '@wordpress/components';

export default function NextPageEdit() {
	return (
		<Separator customText={ __( 'Page break' ) } />
	);
}
