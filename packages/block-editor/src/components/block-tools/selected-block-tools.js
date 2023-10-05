/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId, useViewportMatch } from '@wordpress/compose';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { getScrollContainer } from '@wordpress/dom';
import { VisuallyHidden } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockSelectionButton from './block-selection-button';
import BlockContextualToolbar from './block-contextual-toolbar';
import { store as blockEditorStore } from '../../store';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';
import { useShouldContextualToolbarShow } from '../../utils/use-should-contextual-toolbar-show';

export default function SelectedBlockTools( {
	clientId,
	showEmptyBlockSideInserter,
} ) {
	const {
		capturingClientId,
		isInsertionPointVisible,
		lastClientId,
		rootClientId,
	} = useSelectedBlockToolProps( clientId );

	const { isFixed, shouldShowBreadcrumb } = useSelect( ( select ) => {
		const { getSettings, hasMultiSelection, __unstableGetEditorMode } =
			select( blockEditorStore );

		const editorMode = __unstableGetEditorMode();

		return {
			isFixed: getSettings().hasFixedToolbar,
			shouldShowBreadcrumb:
				! hasMultiSelection() &&
				( editorMode === 'navigation' || editorMode === 'zoom-out' ),
		};
	}, [] );

	const isLargeViewport = useViewportMatch( 'medium' );
	const instanceId = useInstanceId( SelectedBlockTools );
	const descriptionId = `block-editor-block-contextual-toolbar--${ instanceId }`;

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
		contentElement: getScrollContainer(), // This is what useBlockToolbarPopoverProps does when the contentRef is undefined. This likely works by accident. It was being passed in via the BlockTools
		clientId,
	} );

	const KeyboardInstructions = () => {
		return (
			<VisuallyHidden id={ descriptionId }>
				{ __(
					'Press Tab or Shift+Tab to navigate to other toolbars, and press Escape to return focus to the editor.'
				) }
			</VisuallyHidden>
		);
	};

	if ( isFixed || ! isLargeViewport ) {
		return (
			<>
				<KeyboardInstructions />
				<BlockContextualToolbar
					aria-describedby={ descriptionId }
					// Needs to be passed as `true` so it can be set fixed smaller screens as well
					isFixed={ true }
					__experimentalInitialIndex={
						initialToolbarItemIndexRef.current
					}
					__experimentalOnIndexChange={ ( index ) => {
						initialToolbarItemIndexRef.current = index;
					} }
					// Resets the index whenever the active block changes so
					// this is not persisted. See https://github.com/WordPress/gutenberg/pull/25760#issuecomment-717906169
					key={ clientId }
				/>
				{ shouldShowBreadcrumb && (
					<BlockPopover
						clientId={ capturingClientId || clientId }
						bottomClientId={ lastClientId }
						className={ classnames(
							'block-editor-block-list__block-popover',
							{
								'is-insertion-point-visible':
									isInsertionPointVisible,
							}
						) }
						resize={ false }
						{ ...popoverProps }
					>
						<BlockSelectionButton
							clientId={ clientId }
							rootClientId={ rootClientId }
						/>
					</BlockPopover>
				) }
			</>
		);
	}

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
					<>
						<KeyboardInstructions />
						<BlockContextualToolbar
							aria-describedby={ descriptionId }
							// If the toolbar is being shown because of being forced
							// it should focus the toolbar right after the mount.
							focusOnMount={ isToolbarForced.current }
							__experimentalInitialIndex={
								initialToolbarItemIndexRef.current
							}
							__experimentalOnIndexChange={ ( index ) => {
								initialToolbarItemIndexRef.current = index;
							} }
							// Resets the index whenever the active block changes so
							// this is not persisted. See https://github.com/WordPress/gutenberg/pull/25760#issuecomment-717906169
							key={ clientId }
						/>
					</>
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
