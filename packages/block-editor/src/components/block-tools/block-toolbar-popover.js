/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
/**
 * Internal dependencies
 */
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';
import { store as blockEditorStore } from '../../store';
import { PrivateBlockToolbar } from '../block-toolbar';

export default function BlockToolbarPopover( {
	clientId,
	isTyping,
	__unstableContentRef,
} ) {
	const { capturingClientId, isInsertionPointVisible, lastClientId } =
		useSelectedBlockToolProps( clientId );

	// Stores the active toolbar item index so the block toolbar can return focus
	// to it when re-mounting.
	const initialToolbarItemIndexRef = useRef();

	useEffect( () => {
		// Resets the index whenever the active block changes so this is not
		// persisted. See https://github.com/WordPress/gutenberg/pull/25760#issuecomment-717906169
		initialToolbarItemIndexRef.current = undefined;
	}, [ clientId ] );

	const { stopTyping } = useDispatch( blockEditorStore );
	const isToolbarForcedRef = useRef( false );

	useShortcut( 'core/block-editor/focus-toolbar', () => {
		isToolbarForcedRef.current = true;
		stopTyping( true );
	} );

	useEffect( () => {
		isToolbarForcedRef.current = false;
	} );

	// If the block has a parent with __experimentalCaptureToolbars enabled,
	// the toolbar should be positioned over the topmost capturing parent.
	const clientIdToPositionOver = capturingClientId || clientId;

	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId: clientIdToPositionOver,
	} );

	return (
		! isTyping && (
			<BlockPopover
				clientId={ clientIdToPositionOver }
				bottomClientId={ lastClientId }
				className={ clsx( 'block-editor-block-list__block-popover', {
					'is-insertion-point-visible': isInsertionPointVisible,
				} ) }
				resize={ false }
				{ ...popoverProps }
			>
				<PrivateBlockToolbar
					// If the toolbar is being shown because of being forced
					// it should focus the toolbar right after the mount.
					focusOnMount={ isToolbarForcedRef.current }
					__experimentalInitialIndex={
						initialToolbarItemIndexRef.current
					}
					__experimentalOnIndexChange={ ( index ) => {
						initialToolbarItemIndexRef.current = index;
					} }
					variant="toolbar"
				/>
			</BlockPopover>
		)
	);
}
