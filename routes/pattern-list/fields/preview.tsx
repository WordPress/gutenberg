/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Preview } from '@wordpress/lazy-editor';

/**
 * Internal dependencies
 */
import type { NormalizedPattern } from '../use-patterns';

function PreviewField( { item }: { item: NormalizedPattern } ) {
	return (
		<Preview
			blocks={ item.blocks }
			content={ item.content }
			description={ item.description }
		/>
	);
}

export const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: PreviewField,
	enableSorting: false,
};
