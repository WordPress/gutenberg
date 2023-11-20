/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import BlockSelectionButton from './block-selection-button';
import BlockToolbar from '../block-toolbar';
import { store as blockEditorStore } from '../../store';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';
import { useShouldContextualToolbarShow } from '../../utils/use-should-contextual-toolbar-show';

export default function BlockToolbarPopover( {
	clientId,
	showEmptyBlockSideInserter,
	__unstableContentRef,
} ) {
	const {
		capturingClientId,
		isInsertionPointVisible,
		lastClientId,
		rootClientId,
	} = useSelectedBlockToolProps( clientId );

	const { shouldShowBreadcrumb } = useSelect( ( select ) => {
		const { hasMultiSelection, __unstableGetEditorMode } =
			select( blockEditorStore );

		const editorMode = __unstableGetEditorMode();

		return {
			shouldShowBreadcrumb:
				! hasMultiSelection() &&
				( editorMode === 'navigation' || editorMode === 'zoom-out' ),
		};
	}, [] );

	const isToolbarForced = useRef( false );
	const { shouldShowContextualToolbar, canFocusHiddenToolbar } =
		useShouldContextualToolbarShow();

	const { stopTyping } = useDispatch( blockEditorStore );

	useShortcut(
		'core/block-editor/focus-toolbar',
		() => {
			isToolbarForced.current = true;
			stopTyping( true );
		},
		{
			isDisabled: ! canFocusHiddenToolbar,
		}
	);

	useEffect( () => {
		isToolbarForced.current = false;
	} );

	// Stores the active toolbar item index so the block toolbar can return focus
	// to it when re-mounting.
	const initialToolbarItemIndexRef = useRef();

	useEffect( () => {
		// Resets the index whenever the active block changes so this is not
		// persisted. See https://github.com/WordPress/gutenberg/pull/25760#issuecomment-717906169
		initialToolbarItemIndexRef.current = undefined;
	}, [ clientId ] );

	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId,
	} );

	if ( showEmptyBlockSideInserter ) {
		return null;
	}

	if ( shouldShowBreadcrumb || shouldShowContextualToolbar ) {
		return (
			<BlockPopover
				clientId={ capturingClientId || clientId }
				bottomClientId={ lastClientId }
				className={ classnames(
					'block-editor-block-list__block-popover',
					{
						'is-insertion-point-visible': isInsertionPointVisible,
					}
				) }
				resize={ false }
				{ ...popoverProps }
			>
				{ shouldShowContextualToolbar && (
					<BlockToolbar
						// If the toolbar is being shown because of being forced
						// it should focus the toolbar right after the mount.
						focusOnMount={ isToolbarForced.current }
						__experimentalInitialIndex={
							initialToolbarItemIndexRef.current
						}
						__experimentalOnIndexChange={ ( index ) => {
							initialToolbarItemIndexRef.current = index;
						} }
					/>
				) }
				{ shouldShowBreadcrumb && (
					<BlockSelectionButton
						clientId={ clientId }
						rootClientId={ rootClientId }
					/>
				) }
			</BlockPopover>
		);
	}

	return null;
}
