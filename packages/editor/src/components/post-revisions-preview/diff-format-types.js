/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { registerFormatType, unregisterFormatType } from '@wordpress/rich-text';

/**
 * IDs of the visually-hidden description elements rendered into the
 * revisions canvas (see revisions-canvas.js). Diff formats reference
 * these via `aria-describedby` instead of a `title` attribute, since
 * `title` is inconsistently announced by screen readers in
 * low-verbosity modes.
 */
export const DIFF_DESCRIPTION_IDS = {
	removed: 'revision-diff-removed-desc',
	added: 'revision-diff-added-desc',
	formatAdded: 'revision-diff-format-added-desc',
	formatRemoved: 'revision-diff-format-removed-desc',
	formatChanged: 'revision-diff-format-changed-desc',
};

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
		tagName: 'mark',
		className: 'revision-diff-format-added',
	},
	{
		name: 'revision/diff-format-removed',
		title: __( 'Format removed' ),
		tagName: 'mark',
		className: 'revision-diff-format-removed',
	},
	{
		name: 'revision/diff-format-changed',
		title: __( 'Format changed' ),
		tagName: 'mark',
		className: 'revision-diff-format-changed',
	},
];

export function registerDiffFormatTypes() {
	for ( const formatType of DIFF_FORMAT_TYPES ) {
		registerFormatType( formatType.name, {
			...formatType,
			attributes: { 'aria-describedby': 'aria-describedby' },
			edit: () => null,
		} );
	}
}

export function unregisterDiffFormatTypes() {
	for ( const formatType of DIFF_FORMAT_TYPES ) {
		unregisterFormatType( formatType.name );
	}
}
