/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Preview } from '@wordpress/lazy-editor';
import type { WpTemplatePart } from '@wordpress/core-data';

function PreviewField( { item }: { item: WpTemplatePart } ) {
	const description = item.description;

	return <Preview item={ item } description={ description } />;
}

export const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: PreviewField,
	enableSorting: false,
};
