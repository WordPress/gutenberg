/**
 * WordPress dependencies
 */
import { select, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Registers keyboard shortcuts for blocks that participate
 * in document structure such as paragraphs and headings, allowing
 * a user to cycle through diverent document levels.
 *
 * @return {any} value
 */
export default function useTextLevelShortcuts() {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );

	return [
		() => {
			[ 1, 2, 3, 4, 5, 6 ].forEach( ( level ) => {
				registerShortcut( {
					name: `core/block-editor/transform-paragraph-to-heading-${ level }`,
					category: 'block-library',
					description: __( 'Transform paragraph to heading.' ),
					keyCombination: {
						modifier: 'access',
						character: `${ level }`,
					},
				} );
			} );
			registerShortcut( {
				name: `core/block-editor/transform-heading-to-paragraph`,
				category: 'block-library',
				description: __( 'Transform heading to paragraph.' ),
				keyCombination: {
					modifier: 'access',
					character: `0`,
				},
			} );
		},
		( event, level ) => {
			event.preventDefault();
			const destinationBlockName =
				level === 0 ? 'core/paragraph' : 'core/heading';
			const {
				getBlockName,
				getSelectedBlockClientId,
				getBlockAttributes,
			} = select( blockEditorStore );
			const currentClientId = getSelectedBlockClientId();
			if (
				getBlockName( currentClientId ) !== 'core/paragraph' &&
				getBlockName( currentClientId ) !== 'core/heading'
			) {
				return;
			}
			const currentAttributes = getBlockAttributes( currentClientId );
			const { content: currentContent, align: currentAlign } =
				currentAttributes;
			replaceBlocks(
				currentClientId,
				createBlock( destinationBlockName, {
					level,
					content: currentContent,
					align: currentAlign,
				} )
			);
		},
	];
}
