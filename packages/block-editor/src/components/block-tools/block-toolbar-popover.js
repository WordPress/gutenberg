/**
 * External dependencies
 */
import classnames from 'classnames';

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
import { PrivateBlockToolbar } from '../block-toolbar';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';
import { store as blockEditorStore } from '../../store';

export default function BlockToolbarPopover( {
	clientId,
	isTyping,
	__unstableContentRef,
} ) {
	const { stopTyping } = useDispatch( blockEditorStore );
	const { capturingClientId, isInsertionPointVisible, lastClientId } =
		useSelectedBlockToolProps( clientId );

	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId,
	} );

	/**
	 * This is necessary to prevent the toolbar from being in the DOM until a user has stopped typing.
	 * Ideally this is all unnecessary if we can get the toolbar to not impact typing performance, as it
	 * should not. However, once it's mounted, we don't want to remount it again until the block changes.
	 * This is both a bit of a hack and a performance improvement.
	 */
	// Store a ref to always return true once the user has stopped typing. We don't want to remount the toolbar until the clientID changes to avoid doing unnecessary remounting work.
	const hasStoppedTyping = useRef( false );

	useEffect( () => {
		if ( hasStoppedTyping.current ) {
			return;
		}

		if ( ! hasStoppedTyping.current && ! isTyping ) {
			hasStoppedTyping.current = true;
		}
	}, [ isTyping ] );

	// The shortcut doing the work lives in the NavigableToolbar component.
	// It doesn't exist until it's mounted, so we need to dispatch `stopTyping`
	// when the shortcut is pressed to cause a rerender, which mounts the
	// NavigableToolbar and sends focus to the toolbar.
	const isToolbarForced = useRef( false );
	useShortcut( 'core/block-editor/focus-toolbar', () => {
		hasStoppedTyping.current = true;
		isToolbarForced.current = true;
		stopTyping();
	} );

	// Force the component to unmount when the clientID changes.
	useEffect( () => {
		hasStoppedTyping.current = false;
		isToolbarForced.current = false;
	}, [ clientId ] );

	// isTyping will cause a rerender since it's a state change.
	// After that, we can rely on hasStoppedTyping to keep the toolbar in the DOM until the clientID changes.
	return (
		( ! isTyping || hasStoppedTyping.current ) && (
			<BlockPopover
				clientId={ capturingClientId || clientId }
				bottomClientId={ lastClientId }
				className={ classnames(
					'block-editor-block-list__block-popover',
					{
						'is-insertion-point-visible': isInsertionPointVisible,
						'is-hidden': isTyping, // Leave the toolbar in the DOM so it can be focused at the same roving tabindex it was previously at
					}
				) }
				resize={ false }
				{ ...popoverProps }
			>
				<PrivateBlockToolbar
					focusOnMount={ isToolbarForced.current }
					variant="toolbar"
				/>
			</BlockPopover>
		)
	);
}
