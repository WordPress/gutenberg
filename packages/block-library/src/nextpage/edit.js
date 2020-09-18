/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function NextPageEdit() {
	return (
		<div className="wp-block-nextpage">
			<span>{ __( 'Page break' ) }</span>
		</div>
	);
}
