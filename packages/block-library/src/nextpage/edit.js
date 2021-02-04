/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

export default function NextPageEdit() {
	return (
		<div { ...useBlockProps() }>
			<div className="wp-block-nextpage">
				<span>{ __( 'Page break' ) }</span>
			</div>
		</div>
	);
}
