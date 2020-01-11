/**
 * External dependencies
 */
import { findIndex } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
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

function selector( select ) {
	const {
		getSelectedBlockClientId,
		getFirstMultiSelectedBlockClientId,
		isNavigationMode,
		isMultiSelecting,
		__unstableGetBlockWithoutInnerBlocks,
		isTyping,
		isCaretWithinFormattedText,
		getBlockRootClientId,
		isBlockMultiSelected,
		isAncestorMultiSelected,
		getBlockParents,
		getBlockListSettings,
		__experimentalGetBlockListSettingsForBlocks,
		getSettings,
		__unstableGetBlockNode,
	} = select( 'core/block-editor' );

	const clientId = getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();
	const { name, attributes, isValid } = __unstableGetBlockWithoutInnerBlocks( clientId ) || {};

	const blockParentsClientIds = getBlockParents( clientId );
	const blockRootClientId = getBlockRootClientId( clientId );

	const {
		__experimentalMoverDirection,
	} = getBlockListSettings( blockRootClientId ) || {};

	// Get Block List Settings for all ancestors of the current Block clientId
	const ancestorBlockListSettings = __experimentalGetBlockListSettingsForBlocks( blockParentsClientIds );

	// Find the index of the first Block with the `captureDescendantsToolbars` prop defined
	// This will be the top most ancestor because getBlockParents() returns tree from top -> bottom
	const topmostAncestorWithCaptureDescendantsToolbarsIndex = findIndex( ancestorBlockListSettings, [ '__experimentalCaptureToolbars', true ] );

	let capturingBlockId = clientId;

	if ( topmostAncestorWithCaptureDescendantsToolbarsIndex !== -1 ) {
		capturingBlockId = blockParentsClientIds[ topmostAncestorWithCaptureDescendantsToolbarsIndex ];
	}

	const { hasFixedToolbar } = getSettings();

	return {
		name,
		clientId,
		isValid,
		isNavigationMode: isNavigationMode(),
		isMultiSelecting: isMultiSelecting(),
		isTyping: isTyping(),
		isCaretWithinFormattedText: isCaretWithinFormattedText(),
		isEmptyDefaultBlock: name && isUnmodifiedDefaultBlock( { name, attributes } ),
		rootClientId: getBlockRootClientId(),
		isPartOfMultiSelection: isBlockMultiSelected( clientId ) || isAncestorMultiSelected( clientId ),
		hasFixedToolbar,
		__experimentalMoverDirection,
		blockNode: __unstableGetBlockNode( capturingBlockId ),
	};
}

function BlockPopover( { hasMovers = true } ) {
	const {
		name,
		clientId,
		isValid,
		isNavigationMode,
		isMultiSelecting,
		isTyping,
		isCaretWithinFormattedText,
		isEmptyDefaultBlock,
		rootClientId,
		isPartOfMultiSelection,
		hasFixedToolbar,
		__experimentalMoverDirection,
		blockNode,
	} = useSelect( selector, [] );
	const isLargeViewport = useViewportMatch( 'medium' );

	const [ isToolbarForced, setIsToolbarForced ] = useState( false );
	const showEmptyBlockSideInserter = ! isNavigationMode && isEmptyDefaultBlock && isValid;
	const shouldShowBreadcrumb = isNavigationMode;
	const shouldShowContextualToolbar =
		! isNavigationMode &&
		! hasFixedToolbar &&
		isLargeViewport &&
		! showEmptyBlockSideInserter &&
		! isMultiSelecting &&
		( ! isTyping || isCaretWithinFormattedText );

	const canFocusHiddenToolbar = (
		! isNavigationMode &&
		! shouldShowContextualToolbar &&
		! hasFixedToolbar &&
		! isEmptyDefaultBlock
	);

	useShortcut(
		'core/block-editor/focus-toolbar',
		useCallback( () => setIsToolbarForced( true ), [] ),
		{ bindGlobal: true, eventName: 'keydown', isDisabled: ! canFocusHiddenToolbar }
	);

	if ( ! blockNode ) {
		return null;
	}

	if (
		! shouldShowBreadcrumb &&
		! shouldShowContextualToolbar &&
		! isToolbarForced &&
		! showEmptyBlockSideInserter
	) {
		return null;
	}

	// To do: remove align dependency by restricting toolbar position within
	// the editor canvas.
	const align = blockNode.getAttribute( 'data-align' );

	/**
	 * Renders an individual `BlockContextualToolbar` component.
	 * This needs to be a function which generates the component
	 * on demand as we can only have a single toolbar for each render.
	 * This is because of the `isForcingContextualToolbar` logic which
	 * relies on a single toolbar being rendered to update the boolean
	 * value of the ref used to track the "force" state.
	 */
	const renderBlockContextualToolbar = () => (
		<BlockContextualToolbar
			// If the toolbar is being shown because of being forced
			// it should focus the toolbar right after the mount.
			focusOnMount={ isToolbarForced }
			data-type={ name }
			data-align={ align }
			hasMovers={ hasMovers }
		/>
	);

	// Position above the anchor, pop out towards the right, and position in the
	// left corner. For the side inserter, pop out towards the left, and
	// position in the right corner.
	// To do: refactor `Popover` to make this prop clearer.
	const popoverPosition = showEmptyBlockSideInserter ? 'top left right' : 'top right left';
	const popoverIsSticky = isPartOfMultiSelection ? '.wp-block.is-multi-selected' : true;

	return (
		<Popover
			noArrow
			animate={ false }
			position={ popoverPosition }
			focusOnMount={ false }
			anchorRef={ blockNode.lastChild }
			className="block-editor-block-list__block-popover"
			__unstableSticky={ showEmptyBlockSideInserter ? false : popoverIsSticky }
			__unstableSlotName="block-toolbar"
			// Allow subpixel positioning for the block movement animation.
			__unstableAllowVerticalSubpixelPosition={ __experimentalMoverDirection !== 'horizontal' && blockNode }
			__unstableAllowHorizontalSubpixelPosition={ __experimentalMoverDirection === 'horizontal' && blockNode }
			onBlur={ () => setIsToolbarForced( false ) }
		>
			{ ( shouldShowContextualToolbar || isToolbarForced ) && renderBlockContextualToolbar() }
			{ shouldShowBreadcrumb && (
				<BlockBreadcrumb
					clientId={ clientId }
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
	const clientId = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getFirstMultiSelectedBlockClientId,
		} = select( 'core/block-editor' );

		return getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();
	}, [] );

	if ( ! clientId ) {
		return null;
	}

	return <BlockPopover />;
}
