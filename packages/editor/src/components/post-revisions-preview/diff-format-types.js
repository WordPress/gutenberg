/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { registerFormatType, unregisterFormatType } from '@wordpress/rich-text';

const DIFF_FORMAT_TYPES = [
	{
		name: 'revision/diff-removed',
		title: __( 'Removed' ),
		tagName: 'del',
		className: 'revision-diff-removed',
	},
	{
		name: 'revision/diff-added',
		title: __( 'Added' ),
		tagName: 'ins',
		className: 'revision-diff-added',
	},
	{
		name: 'revision/diff-format-added',
		title: __( 'Format added' ),
		tagName: 'span',
		className: 'revision-diff-format-added',
	},
	{
		name: 'revision/diff-format-removed',
		title: __( 'Format removed' ),
		tagName: 'span',
		className: 'revision-diff-format-removed',
	},
	{
		name: 'revision/diff-format-changed',
		title: __( 'Format changed' ),
		tagName: 'span',
		className: 'revision-diff-format-changed',
	},
];

export function registerDiffFormatTypes() {
	for ( const formatType of DIFF_FORMAT_TYPES ) {
		registerFormatType( formatType.name, {
			...formatType,
			attributes: { title: 'title' },
			edit: () => null,
		} );
	}
}

export function unregisterDiffFormatTypes() {
	for ( const formatType of DIFF_FORMAT_TYPES ) {
		unregisterFormatType( formatType.name );
	}
}
