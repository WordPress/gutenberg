/**
 * Block Bindings for Dialog Element Label
 *
 * Provides a binding source so inner paragraph blocks can bind their content
 * directly to the parent Dialog Element block's `dialogLabel` attribute.
 *
 * Pattern modeled after answer-binding example in quiz builder.
 */

/**
 * WordPress dependencies
 */
import {
	registerBlockBindingsSource,
	registerBlockVariation,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function registerDialogElementLabelBinding() {
	registerBlockBindingsSource( {
		name: 'core/dialog-element-label',
		label: __( 'Dialog Element Label' ),
		/**
		 * No external context required; we derive needed info via selection.
		 */
		usesContext: [],
		getValues( { context } ) {
			// We don't rely on context; the binding system calls this with block context.
			const dialogLabel = context[ 'dialog/label' ] ?? null;
			// If we have a dialog label, return it as the content value.
			// Otherwise, return a placeholder prompting the user to add one.
			if ( dialogLabel ) {
				return { content: dialogLabel };
			}
			return {
				placeholder: __( 'Add a dialog label…' ),
			};
		},
		setValues( { select, dispatch, bindings } ) {
			const { newValue } = bindings.content;
			const {
				getSelectedBlockClientId,
				getBlockRootClientId,
				getBlockName,
			} = select( blockEditorStore );

			const selectedBlockClientId = getSelectedBlockClientId();
			if ( ! selectedBlockClientId ) {
				return;
			}
			const rootClientId = getBlockRootClientId( selectedBlockClientId );
			if ( ! rootClientId ) {
				return;
			}
			const rootName = getBlockName( rootClientId );
			if ( 'core/dialog-element' !== rootName ) {
				return; // Safety: only update when inside dialog-element.
			}

			const { updateBlockAttributes } = dispatch( blockEditorStore );
			updateBlockAttributes( rootClientId, { dialogLabel: newValue } );
		},
		canUserEditValue() {
			return true;
		},
	} );

	registerBlockVariation( 'core/heading', {
		name: 'core-dialog-element-label',
		title: __( 'Dialog Label' ),
		description: __(
			'Displays and edits the dialog element label (for accessibility).'
		),
		attributes: {
			placeholder: __( 'Add a dialog label…' ),
			level: 2,
			metadata: {
				bindings: {
					content: {
						source: 'core/dialog-element-label',
					},
				},
			},
		},
		ancestor: [ 'core/dialog-element' ],
		isActive: ( blockAttributes, variationAttributes ) => {
			return (
				blockAttributes.metadata?.bindings?.content?.source ===
				variationAttributes.metadata?.bindings.content.source
			);
		},
	} );
}
