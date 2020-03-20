/**
 * External dependencies
 */
import { findIndex } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useContext } from '@wordpress/element';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { Popover } from '@wordpress/components';
import { useSelector } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockBreadcrumb from './breadcrumb';
import BlockContextualToolbar from './block-contextual-toolbar';
import Inserter from '../inserter';
import { BlockNodes } from './root-container';

function BlockPopover( {
	clientId,
	rootClientId,
	align,
	isValid,
	moverDirection,
	isEmptyDefaultBlock,
	capturingClientId,
} ) {
	const {
		isNavigationMode,
		isMultiSelecting,
		isTyping,
		isCaretWithinFormattedText,
		hasMultiSelection,
		getSettings,
		getLastMultiSelectedBlockClientId,
	} = useSelector( 'core/block-editor' );
	const isLargeViewport = useViewportMatch( 'medium' );
	const [ isToolbarForced, setIsToolbarForced ] = useState( false );
	const [ isInserterShown, setIsInserterShown ] = useState( false );
	const [ blockNodes ] = useContext( BlockNodes );

	const { hasFixedToolbar } = getSettings();
	const showEmptyBlockSideInserter =
		! isNavigationMode() && isEmptyDefaultBlock && isValid;
	const shouldShowBreadcrumb = isNavigationMode();
	const shouldShowContextualToolbar =
		! isNavigationMode() &&
		! hasFixedToolbar &&
		isLargeViewport &&
		! showEmptyBlockSideInserter &&
		! isMultiSelecting() &&
		( ! isTyping() || isCaretWithinFormattedText() );
	const canFocusHiddenToolbar =
		! isNavigationMode() &&
		! shouldShowContextualToolbar &&
		! hasFixedToolbar &&
		! isEmptyDefaultBlock;

	useShortcut(
		'core/block-editor/focus-toolbar',
		useCallback( () => setIsToolbarForced( true ), [] ),
		{
			bindGlobal: true,
			eventName: 'keydown',
			isDisabled: ! canFocusHiddenToolbar,
		}
	);

	if (
		! shouldShowBreadcrumb &&
		! shouldShowContextualToolbar &&
		! isToolbarForced &&
		! showEmptyBlockSideInserter
	) {
		return null;
	}

	let node = blockNodes[ clientId ];

	if ( capturingClientId ) {
		node = document.getElementById( 'block-' + capturingClientId );
	}

	if ( ! node ) {
		return null;
	}

	// A block may specify a different target element for the toolbar.
	if ( node.classList.contains( 'is-block-collapsed' ) ) {
		node = node.querySelector( '.is-block-content' ) || node;
	}

	let anchorRef = node;

	if ( hasMultiSelection() ) {
		const bottomNode = blockNodes[ getLastMultiSelectedBlockClientId() ];

		// Wait to render the popover until the bottom reference is available
		// as well.
		if ( ! bottomNode ) {
			return null;
		}

		anchorRef = {
			top: node,
			bottom: bottomNode,
		};
	}

	function onFocus() {
		setIsInserterShown( true );
	}

	function onBlur() {
		setIsInserterShown( false );
	}

	// Position above the anchor, pop out towards the right, and position in the
	// left corner. For the side inserter, pop out towards the left, and
	// position in the right corner.
	// To do: refactor `Popover` to make this prop clearer.
	const popoverPosition = showEmptyBlockSideInserter
		? 'top left right'
		: 'top right left';

	return (
		<Popover
			noArrow
			animate={ false }
			position={ popoverPosition }
			focusOnMount={ false }
			anchorRef={ anchorRef }
			className="block-editor-block-list__block-popover"
			__unstableSticky={ ! showEmptyBlockSideInserter }
			__unstableSlotName="block-toolbar"
			__unstableBoundaryParent
			// Allow subpixel positioning for the block movement animation.
			__unstableAllowVerticalSubpixelPosition={
				moverDirection !== 'horizontal' && node
			}
			__unstableAllowHorizontalSubpixelPosition={
				moverDirection === 'horizontal' && node
			}
			onBlur={ () => setIsToolbarForced( false ) }
			shouldAnchorIncludePadding
			// Popover calculates the width once. Trigger a reset by remounting
			// the component.
			key={ shouldShowContextualToolbar }
		>
			{ ( shouldShowContextualToolbar || isToolbarForced ) && (
				<div
					onFocus={ onFocus }
					onBlur={ onBlur }
					// While ideally it would be enough to capture the
					// bubbling focus event from the Inserter, due to the
					// characteristics of click focusing of `button`s in
					// Firefox and Safari, it is not reliable.
					//
					// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
					tabIndex={ -1 }
					className={ classnames(
						'block-editor-block-list__block-popover-inserter',
						{
							'is-visible': isInserterShown,
						}
					) }
				>
					<Inserter
						clientId={ clientId }
						rootClientId={ rootClientId }
					/>
				</div>
			) }
			{ ( shouldShowContextualToolbar || isToolbarForced ) && (
				<BlockContextualToolbar
					// If the toolbar is being shown because of being forced
					// it should focus the toolbar right after the mount.
					focusOnMount={ isToolbarForced }
					data-align={ align }
				/>
			) }
			{ shouldShowBreadcrumb && (
				<BlockBreadcrumb
					clientId={ clientId }
					rootClientId={ rootClientId }
					moverDirection={ moverDirection }
					data-align={ align }
				/>
			) }
			{ showEmptyBlockSideInserter && (
				<div className="block-editor-block-list__empty-block-inserter">
					<Inserter
						position="top right"
						rootClientId={ rootClientId }
						clientId={ clientId }
					/>
				</div>
			) }
		</Popover>
	);
}

export default function WrappedBlockPopover() {
	const {
		getSelectedBlockClientId,
		getFirstMultiSelectedBlockClientId,
		getBlockRootClientId,
		__unstableGetBlockWithoutInnerBlocks,
		getBlockParents,
		getBlockListSettings,
		__experimentalGetBlockListSettingsForBlocks,
	} = useSelector( 'core/block-editor' );

	const clientId =
		getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();

	if ( ! clientId ) {
		return null;
	}

	const { name, attributes = {}, isValid } =
		__unstableGetBlockWithoutInnerBlocks( clientId ) || {};

	if ( ! name ) {
		return null;
	}

	const rootClientId = getBlockRootClientId( clientId );
	const blockParentsClientIds = getBlockParents( clientId );
	const { __experimentalMoverDirection: moverDirection } =
		getBlockListSettings( rootClientId ) || {};

	// Get Block List Settings for all ancestors of the current Block clientId
	const ancestorBlockListSettings = __experimentalGetBlockListSettingsForBlocks(
		blockParentsClientIds
	);

	// Find the index of the first Block with the `captureDescendantsToolbars` prop defined
	// This will be the top most ancestor because getBlockParents() returns tree from top -> bottom
	const topmostAncestorWithCaptureDescendantsToolbarsIndex = findIndex(
		ancestorBlockListSettings,
		[ '__experimentalCaptureToolbars', true ]
	);

	let capturingClientId;

	if ( topmostAncestorWithCaptureDescendantsToolbarsIndex !== -1 ) {
		capturingClientId =
			blockParentsClientIds[
				topmostAncestorWithCaptureDescendantsToolbarsIndex
			];
	}

	const { align } = attributes;
	const isEmptyDefaultBlock =
		name && isUnmodifiedDefaultBlock( { name, attributes } );

	return (
		<BlockPopover
			clientId={ clientId }
			rootClientId={ rootClientId }
			align={ align }
			isValid={ isValid }
			moverDirection={ moverDirection }
			isEmptyDefaultBlock={ isEmptyDefaultBlock }
			capturingClientId={ capturingClientId }
		/>
	);
}
