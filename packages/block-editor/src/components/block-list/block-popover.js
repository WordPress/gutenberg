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
import { useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockBreadcrumb from './breadcrumb';
import BlockContextualToolbar from './block-contextual-toolbar';
import Inserter from '../inserter';
import { BlockNodes } from './root-container';

function selector( select ) {
	const {
		isNavigationMode,
		isMultiSelecting,
		hasMultiSelection,
		isTyping,
		isCaretWithinFormattedText,
		getSettings,
		getLastMultiSelectedBlockClientId,
	} = select( 'core/block-editor' );
	return {
		isNavigationMode: isNavigationMode(),
		isMultiSelecting: isMultiSelecting(),
		isTyping: isTyping(),
		isCaretWithinFormattedText: isCaretWithinFormattedText(),
		hasMultiSelection: hasMultiSelection(),
		hasFixedToolbar: getSettings().hasFixedToolbar,
		lastClientId: getLastMultiSelectedBlockClientId(),
	};
}

function BlockPopover( {
	clientId,
	rootClientId,
	name,
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
		hasFixedToolbar,
		lastClientId,
	} = useSelect( selector, [] );
	const isLargeViewport = useViewportMatch( 'medium' );
	const [ isToolbarForced, setIsToolbarForced ] = useState( false );
	const [ isInserterShown, setIsInserterShown ] = useState( false );
	const [ blockNodes ] = useContext( BlockNodes );

	const showEmptyBlockSideInserter =
		! isNavigationMode && isEmptyDefaultBlock && isValid;
	const shouldShowBreadcrumb = isNavigationMode;
	const shouldShowContextualToolbar =
		! isNavigationMode &&
		! hasFixedToolbar &&
		isLargeViewport &&
		! showEmptyBlockSideInserter &&
		! isMultiSelecting &&
		( ! isTyping || isCaretWithinFormattedText );
	const canFocusHiddenToolbar =
		! isNavigationMode &&
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

	if ( hasMultiSelection ) {
		const bottomNode = blockNodes[ lastClientId ];

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
			// Allow subpixel positioning for the block movement animation.
			__unstableAllowVerticalSubpixelPosition={
				moverDirection !== 'horizontal' && node
			}
			__unstableAllowHorizontalSubpixelPosition={
				moverDirection === 'horizontal' && node
			}
			onBlur={ () => setIsToolbarForced( false ) }
			shouldAnchorIncludePadding
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
					data-type={ name }
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

function wrapperSelector( select ) {
	const {
		getSelectedBlockClientId,
		getFirstMultiSelectedBlockClientId,
		getBlockRootClientId,
		__unstableGetBlockWithoutInnerBlocks,
		getBlockParents,
		getBlockListSettings,
		__experimentalGetBlockListSettingsForBlocks,
	} = select( 'core/block-editor' );

	const clientId =
		getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();

	if ( ! clientId ) {
		return;
	}

	const rootClientId = getBlockRootClientId( clientId );
	const { name, attributes = {}, isValid } =
		__unstableGetBlockWithoutInnerBlocks( clientId ) || {};
	const blockParentsClientIds = getBlockParents( clientId );
	const { __experimentalMoverDirection } =
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

	return {
		clientId,
		rootClientId: getBlockRootClientId( clientId ),
		name,
		align: attributes.align,
		isValid,
		moverDirection: __experimentalMoverDirection,
		isEmptyDefaultBlock:
			name && isUnmodifiedDefaultBlock( { name, attributes } ),
		capturingClientId,
	};
}

export default function WrappedBlockPopover() {
	const selected = useSelect( wrapperSelector, [] );

	if ( ! selected ) {
		return null;
	}

	const {
		clientId,
		rootClientId,
		name,
		align,
		isValid,
		moverDirection,
		isEmptyDefaultBlock,
		capturingClientId,
	} = selected;

	if ( ! name ) {
		return null;
	}

	return (
		<BlockPopover
			clientId={ clientId }
			rootClientId={ rootClientId }
			name={ name }
			align={ align }
			isValid={ isValid }
			moverDirection={ moverDirection }
			isEmptyDefaultBlock={ isEmptyDefaultBlock }
			capturingClientId={ capturingClientId }
		/>
	);
}
