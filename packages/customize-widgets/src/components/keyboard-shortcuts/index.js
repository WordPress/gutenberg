/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { isAppleOS } from '@wordpress/keycodes';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

function KeyboardShortcuts( { undo, redo, save } ) {
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

	useShortcut( 'core/customize-widgets/undo', ( event ) => {
		undo();
		event.preventDefault();
	} );

	useShortcut( 'core/customize-widgets/redo', ( event ) => {
		redo();
		event.preventDefault();
	} );

	useShortcut( 'core/customize-widgets/save', ( event ) => {
		event.preventDefault();
		save();
	} );

	useShortcut(
		'core/customize-widgets/transform-heading-to-paragraph',
		( event ) => handleTextLevelShortcut( event, 0 )
	);

	[ 1, 2, 3, 4, 5, 6 ].forEach( ( level ) => {
		//the loop is based off on a constant therefore
		//the hook will execute the same way every time
		//eslint-disable-next-line react-hooks/rules-of-hooks
		useShortcut(
			`core/customize-widgets/transform-paragraph-to-heading-${ level }`,
			( event ) => handleTextLevelShortcut( event, level )
		);
	} );

	return null;
}

function KeyboardShortcutsRegister() {
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);

	useEffect( () => {
		registerShortcut( {
			name: 'core/customize-widgets/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/customize-widgets/redo',
			category: 'global',
			description: __( 'Redo your last undo.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'z',
			},
			// Disable on Apple OS because it conflicts with the browser's
			// history shortcut. It's a fine alias for both Windows and Linux.
			// Since there's no conflict for Ctrl+Shift+Z on both Windows and
			// Linux, we keep it as the default for consistency.
			aliases: isAppleOS()
				? []
				: [
						{
							modifier: 'primary',
							character: 'y',
						},
				  ],
		} );

		registerShortcut( {
			name: 'core/customize-widgets/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );

		registerShortcut( {
			name: 'core/customize-widgets/transform-heading-to-paragraph',
			category: 'block-library',
			description: __( 'Transform heading to paragraph.' ),
			keyCombination: {
				modifier: 'access',
				character: `0`,
			},
		} );

		[ 1, 2, 3, 4, 5, 6 ].forEach( ( level ) => {
			registerShortcut( {
				name: `core/customize-widgets/transform-paragraph-to-heading-${ level }`,
				category: 'block-library',
				description: __( 'Transform paragraph to heading.' ),
				keyCombination: {
					modifier: 'access',
					character: `${ level }`,
				},
			} );
		} );

		return () => {
			unregisterShortcut( 'core/customize-widgets/undo' );
			unregisterShortcut( 'core/customize-widgets/redo' );
			unregisterShortcut( 'core/customize-widgets/save' );
		};
	}, [ registerShortcut ] );

	return null;
}

KeyboardShortcuts.Register = KeyboardShortcutsRegister;
export default KeyboardShortcuts;
