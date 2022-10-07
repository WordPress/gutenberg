/**
 * WordPress dependencies
 */
import { select, useDispatch } from '@wordpress/data';
import {
	__unstableUseShortcutEventMatch as useShortcutEventMatch,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

// we want to register the shortcuts only for the 1st block
// that appears in the canvas
let REGISTRATION_PASS = 0;

/**
 * Registers keyboard shortcuts for blocks that participate
 * in document structure such as paragraphs and headings, allowing
 * a user to cycle through diverent document levels.
 *
 * @return {any} value
 */
export default function useSemanticLevelShortcuts() {
	REGISTRATION_PASS++;
	const isMatch = useShortcutEventMatch();
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	if ( REGISTRATION_PASS === 1 ) {
		[ 1, 2, 3, 4, 5, 6, 0 ].forEach( ( level ) => {
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
	}
	return ( event ) => {
		[ 1, 2, 3, 4, 5, 6, 0 ].forEach( ( level ) => {
			if (
				isMatch(
					`core/block-editor/transform-paragraph-to-heading-${ level }`,
					event
				)
			) {
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
			}
		} );
	};
}
