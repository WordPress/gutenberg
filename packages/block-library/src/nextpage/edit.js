/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Separator } from '@wordpress/components';

export default function NextPageEdit() {
	return (
		<Separator className="wp-block-nextpage" customText={ __( 'Page break' ) } />
	);
}
