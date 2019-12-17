/**
 * External dependencies
 */
import { first, last } from 'lodash';
/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

function KeyboardShortcuts() {
	const target = useRef( null );

	// Registering the shortcuts
	const { registerShortcut } = useDispatch( 'core/keyboard-shortcuts' );
	useEffect( () => {
		registerShortcut( 'core/block-editor/duplicate', 'block', {
			modifier: 'primaryShift',
			character: 'd',
		} );

		registerShortcut( 'core/block-editor/remove', 'block', {
			modifier: 'access',
			character: 'z',
		} );

		registerShortcut( 'core/block-editor/insertBefore', 'block', {
			modifier: 'primaryAlt',
			character: 't',
		} );

		registerShortcut( 'core/block-editor/insertAfter', 'block', {
			modifier: 'primaryAlt',
			character: 'y',
		} );

		registerShortcut( 'core/block-editor/deleteMultiSelection', 'block', {
			character: 'del',
			aliases: [
				'backspace',
			],
		} );

		registerShortcut( 'core/block-editor/selectAll', 'selection', {
			modifier: 'primary',
			character: 'a',
		} );

		registerShortcut( 'core/block-editor/unselect', 'selections', {
			character: 'escape',
		} );
	}, [ registerShortcut ] );

	// Shortcuts Logic
	const { clientIds, rootBlocksClientIds } = useSelect( ( select ) => {
		const { getSelectedBlockClientIds, getBlockOrder } = select( 'core/block-editor' );
		return {
			clientIds: getSelectedBlockClientIds(),
			rootBlocksClientIds: getBlockOrder(),
		};
	}, [] );

	const {
		duplicateBlocks,
		removeBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		multiSelect,
		clearSelectedBlock,
	} = useDispatch( 'core/block-editor' );

	// Prevents bookmark all Tabs shortcut in Chrome when devtools are closed.
	// Prevents reposition Chrome devtools pane shortcut when devtools are open.
	useShortcut( 'core/block-editor/duplicate', useCallback( ( event ) => {
		event.preventDefault();
		duplicateBlocks( clientIds );
	}, [ clientIds, duplicateBlocks ] ), { bindGlobal: true } );

	// Does not clash with any known browser/native shortcuts, but preventDefault
	// is used to prevent any obscure unknown shortcuts from triggering.
	useShortcut( 'core/block-editor/remove', useCallback( ( event ) => {
		event.preventDefault();
		removeBlocks( clientIds );
	}, [ clientIds, removeBlocks ] ), { bindGlobal: true } );

	// Does not clash with any known browser/native shortcuts, but preventDefault
	// is used to prevent any obscure unknown shortcuts from triggering.
	useShortcut( 'core/block-editor/insertAfter', useCallback( ( event ) => {
		event.preventDefault();
		insertAfterBlock( last( clientIds ) );
	}, [ clientIds, insertAfterBlock ] ), { bindGlobal: true } );

	// Prevent 'view recently closed tabs' in Opera using preventDefault.
	useShortcut( 'core/block-editor/insertBefore', useCallback( ( event ) => {
		event.preventDefault();
		insertBeforeBlock( first( clientIds ) );
	}, [ clientIds, insertBeforeBlock ] ), { bindGlobal: true } );

	useShortcut( 'core/block-editor/deleteMultiSelection', useCallback( () => {
		if ( clientIds.length > 0 ) {
			removeBlocks( clientIds );
		}
	}, [ clientIds, removeBlocks ] ), { target } );

	useShortcut( 'core/block-editor/selectAll', useCallback( ( event ) => {
		event.preventDefault();
		multiSelect( first( rootBlocksClientIds ), last( rootBlocksClientIds ) );
	}, [ rootBlocksClientIds, multiSelect ] ), { target } );

	useShortcut( 'core/block-editor/unselect', useCallback( () => {
		if ( clientIds.length > 1 ) {
			clearSelectedBlock();
			window.getSelection().removeAllRanges();
		}
	}, [ clientIds, clearSelectedBlock ] ), { target } );

	return <div ref={ target } />;
}

export default KeyboardShortcuts;
