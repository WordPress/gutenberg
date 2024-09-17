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
import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

function BlockKeyboardShortcuts() {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { getBlockName, getSelectedBlockClientId, getBlockAttributes } =
		useSelect( blockEditorStore );

	const handleTransformHeadingAndParagraph = ( event, level ) => {
		event.preventDefault();

		const currentClientId = getSelectedBlockClientId();
		if ( currentClientId === null ) {
			return;
		}

		const blockName = getBlockName( currentClientId );
		const isParagraph = blockName === 'core/paragraph';
		const isHeading = blockName === 'core/heading';

		if ( ! isParagraph && ! isHeading ) {
			return;
		}

		const destinationBlockName =
			level === 0 ? 'core/paragraph' : 'core/heading';

		const attributes = getBlockAttributes( currentClientId );

		// Avoid unnecessary block transform when attempting to transform to
		// the same block type and/or same level.
		if (
			( isParagraph && level === 0 ) ||
			( isHeading && attributes.level === level )
		) {
			return;
		}

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
			name: 'core/block-editor/transform-heading-to-paragraph',
			category: 'block-library',
			description: __( 'Transform heading to paragraph.' ),
			keyCombination: {
				modifier: 'access',
				character: '0',
			},
			aliases: [
				{
					modifier: 'access',
					character: '7',
				},
			],
		} );

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
	}, [] );

	useShortcut(
		'core/block-editor/transform-heading-to-paragraph',
		( event ) => handleTransformHeadingAndParagraph( event, 0 )
	);

	[ 1, 2, 3, 4, 5, 6 ].forEach( ( level ) => {
		//the loop is based off on a constant therefore
		//the hook will execute the same way every time
		//eslint-disable-next-line react-hooks/rules-of-hooks
		useShortcut(
			`core/block-editor/transform-paragraph-to-heading-${ level }`,
			( event ) => handleTransformHeadingAndParagraph( event, level )
		);
	} );

	return null;
}

export default BlockKeyboardShortcuts;
