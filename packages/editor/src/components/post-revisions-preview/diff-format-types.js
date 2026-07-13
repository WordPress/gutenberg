/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { registerFormatType, unregisterFormatType } from '@wordpress/rich-text';
import { useRefEffect } from '@wordpress/compose';

const DIFF_FORMAT_TYPES = [
	{
		name: 'revision/diff-removed',
		title: __( 'Removed' ),
		tagName: 'del',
		className: 'revision-diff-removed',
		descriptionId: 'revision-diff-description-removed',
	},
	{
		name: 'revision/diff-added',
		title: __( 'Added' ),
		tagName: 'ins',
		className: 'revision-diff-added',
		descriptionId: 'revision-diff-description-added',
	},
	{
		name: 'revision/diff-format-added',
		title: __( 'Format added' ),
		tagName: 'span',
		className: 'revision-diff-format-added',
		descriptionId: 'revision-diff-description-format-added',
	},
	{
		name: 'revision/diff-format-removed',
		title: __( 'Format removed' ),
		tagName: 'span',
		className: 'revision-diff-format-removed',
		descriptionId: 'revision-diff-description-format-removed',
	},
	{
		name: 'revision/diff-format-changed',
		title: __( 'Format changed' ),
		tagName: 'span',
		className: 'revision-diff-format-changed',
		descriptionId: 'revision-diff-description-format-changed',
	},
];

/**
 * IDs of the visually hidden description elements referenced by
 * `aria-describedby` on inline diff formats, keyed by diff type.
 * The `title` attribute alone is unreliable as an accessible description —
 * screen readers may ignore it in low-verbosity modes — so the formats also
 * reference these elements, which `useDiffDescriptionsRef` renders into the
 * editor canvas document.
 */
export const DIFF_DESCRIPTION_IDS = {
	removed: 'revision-diff-description-removed',
	added: 'revision-diff-description-added',
	formatAdded: 'revision-diff-description-format-added',
	formatRemoved: 'revision-diff-description-format-removed',
	formatChanged: 'revision-diff-description-format-changed',
};

export function registerDiffFormatTypes() {
	for ( const { descriptionId, ...formatType } of DIFF_FORMAT_TYPES ) {
		registerFormatType( formatType.name, {
			...formatType,
			attributes: { title: 'title', ariaDescribedBy: 'aria-describedby' },
			edit: () => null,
		} );
	}
}

/**
 * Hook returning a ref callback that renders the visually hidden elements
 * describing each inline diff format into the document that hosts the ref
 * element (the editor canvas iframe). Inline diff formats reference these
 * elements via `aria-describedby`, which must resolve within the same
 * document, and — unlike `title` — is announced reliably by screen readers.
 *
 * @return {Function} Ref callback for an element inside the canvas document.
 */
export function useDiffDescriptionsRef() {
	return useRefEffect( ( element ) => {
		const { ownerDocument } = element;
		const container = ownerDocument.createElement( 'div' );
		// Hidden elements are still used for the accessible description
		// computation when referenced by `aria-describedby`.
		container.hidden = true;
		for ( const { descriptionId, title } of DIFF_FORMAT_TYPES ) {
			const description = ownerDocument.createElement( 'span' );
			description.id = descriptionId;
			description.textContent = title;
			container.appendChild( description );
		}
		ownerDocument.body.appendChild( container );
		return () => {
			container.remove();
		};
	}, [] );
}

export function unregisterDiffFormatTypes() {
	for ( const formatType of DIFF_FORMAT_TYPES ) {
		unregisterFormatType( formatType.name );
	}
}
