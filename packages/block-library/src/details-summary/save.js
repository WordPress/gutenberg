/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function save( { attributes } ) {
	const summary = attributes.summary ? attributes.summary : __( 'Details' );
	return (
		<summary { ...useBlockProps.save() }>
			<RichText.Content value={ summary } />
		</summary>
	);
}
