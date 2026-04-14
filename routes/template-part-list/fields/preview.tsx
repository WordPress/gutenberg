/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Preview } from '@wordpress/lazy-editor';
import type { WpTemplatePart } from '@wordpress/core-data';

function PreviewField( { item }: { item: WpTemplatePart } ) {
	const description = item.description;

	return (
		<Preview
			content={ item?.content?.raw }
			blocks={ item?.blocks }
			description={ description }
		/>
	);
}

export const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: PreviewField,
	enableSorting: false,
};
