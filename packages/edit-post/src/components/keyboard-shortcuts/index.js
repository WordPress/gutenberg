/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

function KeyboardShortcuts() {
	const { toggleFeature } = useDispatch( editPostStore );
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { getBlockName, getSelectedBlockClientId, getBlockAttributes } =
		useSelect( blockEditorStore );

	const handleTextLevelShortcut = ( event, level ) => {
		event.preventDefault();
		const destinationBlockName =
			level === 0 ? 'core/paragraph' : 'core/heading';
		const currentClientId = getSelectedBlockClientId();
		if ( currentClientId === null ) {
			return;
		}
		const blockName = getBlockName( currentClientId );
		if ( blockName !== 'core/paragraph' && blockName !== 'core/heading' ) {
			return;
		}
		const attributes = getBlockAttributes( currentClientId );
		const textAlign =
			blockName === 'core/paragraph' ? 'align' : 'textAlign';
		const destinationTextAlign =
			destinationBlockName === 'core/paragraph' ? 'align' : 'textAlign';

		replaceBlocks(
			currentClientId,
			createBlock( destinationBlockName, {
				level,
				content: attributes.content,
				...{ [ destinationTextAlign ]: attributes[ textAlign ] },
			} )
		);
	};

	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-post/toggle-fullscreen',
			category: 'global',
			description: __( 'Toggle fullscreen mode.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'f',
			},
		} );

		registerShortcut( {
			name: 'core/edit-post/next-region',
			category: 'global',
			description: __( 'Navigate to the next part of the editor.' ),
			keyCombination: {
				modifier: 'ctrl',
				character: '`',
			},
			aliases: [
				{
					modifier: 'access',
					character: 'n',
				},
			],
		} );

		registerShortcut( {
			name: 'core/edit-post/previous-region',
			category: 'global',
			description: __( 'Navigate to the previous part of the editor.' ),
			keyCombination: {
				modifier: 'ctrlShift',
				character: '`',
			},
			aliases: [
				{
					modifier: 'access',
					character: 'p',
				},
				{
					modifier: 'ctrlShift',
					character: '~',
				},
			],
		} );

		registerShortcut( {
			name: 'core/edit-post/transform-heading-to-paragraph',
			category: 'block-library',
			description: __( 'Transform heading to paragraph.' ),
			keyCombination: {
				modifier: 'access',
				character: `0`,
			},
		} );

		[ 1, 2, 3, 4, 5, 6 ].forEach( ( level ) => {
			registerShortcut( {
				name: `core/edit-post/transform-paragraph-to-heading-${ level }`,
				category: 'block-library',
				description: __( 'Transform paragraph to heading.' ),
				keyCombination: {
					modifier: 'access',
					character: `${ level }`,
				},
			} );
		} );
	}, [] );

	useShortcut( 'core/edit-post/toggle-fullscreen', () => {
		toggleFeature( 'fullscreenMode' );
	} );

	useShortcut( 'core/edit-post/transform-heading-to-paragraph', ( event ) =>
		handleTextLevelShortcut( event, 0 )
	);

	[ 1, 2, 3, 4, 5, 6 ].forEach( ( level ) => {
		//the loop is based off on a constant therefore
		//the hook will execute the same way every time
		//eslint-disable-next-line react-hooks/rules-of-hooks
		useShortcut(
			`core/edit-post/transform-paragraph-to-heading-${ level }`,
			( event ) => handleTextLevelShortcut( event, level )
		);
	} );

	return null;
}

export default KeyboardShortcuts;
