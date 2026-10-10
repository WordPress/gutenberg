import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import {
	getBlockType,
	hasBlockSupport,
	isReusableBlock,
	isTemplatePart,
} from '@wordpress/blocks';
import {
	ToolbarGroup,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import BlockMover from '../block-mover';
import BlockParentSelector from '../block-parent-selector';
import BlockControls from '../block-controls';
import blockControlsGroups from '../block-controls/groups';
import __unstableBlockToolbarLastItem from './block-toolbar-last-item';
import BlockSettingsMenu from '../block-settings-menu';
import { BlockLockToolbar } from '../block-lock';
import { ViewportVisibilityToolbar } from '../block-visibility';
import { BlockGroupToolbar } from '../convert-to-group-buttons';
import BlockEditVisuallyButton from '../block-edit-visually-button';
import { useShowHoveredOrFocusedGestures } from './utils';
import { store as blockEditorStore } from '../../store';
import NavigableToolbar from '../navigable-toolbar';
import { useHasBlockToolbar } from './use-has-block-toolbar';
import ChangeDesign from './change-design';
import SwitchSectionStyle from './switch-section-style';
import EditSectionButton from './edit-section-button';
import BlockEditToggle from './block-edit-toggle';
import { unlock } from '../../lock-unlock';
import { deviceTypeKey } from '../../store/private-keys';
import BlockToolbarIcon from './block-toolbar-icon';
import { hasViewportBlockStyleState } from '../../hooks/block-style-state';

/**
 * Whether any block, or a block support, has added editing tools to the
 * toolbar of the selected block. Fills register whether or not their slot is
 * rendered, so this also works while the block view hides the slots.
 *
 * @param {boolean} showStyleStateSlot Whether the style state slot replaces the regular slots.
 *
 * @return {boolean} Whether there are editing tools to show.
 */
function useHasContentTools( showStyleStateSlot ) {
	const blockFills = useSlotFills( blockControlsGroups.block.name );
	const defaultFills = useSlotFills( blockControlsGroups.default.name );
	const inlineFills = useSlotFills( blockControlsGroups.inline.name );
	const otherFills = useSlotFills( blockControlsGroups.other.name );
	const styleStateFills = useSlotFills(
		blockControlsGroups[ 'style-state' ].name
	);
	if ( showStyleStateSlot ) {
		return !! styleStateFills?.length;
	}
	return [ blockFills, defaultFills, inlineFills, otherFills ].some(
		( fills ) => !! fills?.length
	);
}

/**
 * Renders the block toolbar.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-toolbar/README.md
 *
 * @param {Object}   props                             Components props.
 * @param {boolean}  props.hideDragHandle              Show or hide the Drag Handle for drag and drop functionality.
 * @param {boolean}  props.focusOnMount                Focus the toolbar when mounted.
 * @param {number}   props.__experimentalInitialIndex  The initial index of the toolbar item to focus.
 * @param {Function} props.__experimentalOnIndexChange Callback function to be called when the index of the focused toolbar item changes.
 * @param {string}   props.variant                     Style variant of the toolbar, also passed to the Dropdowns rendered from Block Toolbar Buttons.
 * @param {boolean}  props.showPlaceholder             While no block is selected, show the default block's icon and the mover, disabled.
 */
export function PrivateBlockToolbar( {
	hideDragHandle,
	focusOnMount,
	__experimentalInitialIndex,
	__experimentalOnIndexChange,
	variant = 'unstyled',
	showPlaceholder = false,
} ) {
	const {
		blockClientId,
		blockClientIds,
		isDefaultEditingMode,
		blockType,
		toolbarKey,
		shouldShowVisualToolbar,
		showParentSelector,
		isUsingBindings,
		isSectionContainer,
		hasContentOnlyLocking,
		showShuffleButton,
		showSlots,
		showGroupButtons,
		showLockButtons,
		showBlockVisibilityButton,
		showSwitchSectionStyleButton,
		areSelectedBlocksHiddenOnViewport,
		showStyleStateSlot,
		canEdit,
		isEditedSection,
		toolbarView,
	} = useSelect( ( select ) => {
		const { canEditBlock } = select( blockEditorStore );
		const {
			getBlockName,
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockEditingMode,
			getBlockAttributes,
			getSettings,
			getTemplateLock,
			getParentSectionBlock,
			getEnabledBlockParents,
			isZoomOut,
			isSectionBlock,
			isBlockHiddenAtViewport,
			getSelectedBlockStyleState,
			isResponsiveEditing,
			getEditedContentOnlySection,
			getBlockToolbarView,
		} = unlock( select( blockEditorStore ) );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const parentSection = getParentSectionBlock( selectedBlockClientId );
		// The parent is the nearest one shown in List View and the breadcrumb,
		// skipping any disabled blocks in between.
		const parentClientId = getEnabledBlockParents(
			selectedBlockClientId,
			true
		)[ 0 ];
		const parentBlockName = getBlockName( parentClientId );
		const parentBlockType = getBlockType( parentBlockName );
		const editingMode = getBlockEditingMode( selectedBlockClientId );
		const _isDefaultEditingMode = editingMode === 'default';
		const _blockName = getBlockName( selectedBlockClientId );
		const isValid = selectedBlockClientIds.every( ( id ) =>
			isBlockValid( id )
		);
		const isVisual = selectedBlockClientIds.every(
			( id ) => getBlockMode( id ) === 'visual'
		);
		const _isUsingBindings =
			selectedBlockClientIds.length > 0 &&
			selectedBlockClientIds.every(
				( clientId ) =>
					!! getBlockAttributes( clientId )?.metadata?.bindings
			);

		// If one or more selected blocks are locked, do not show the BlockGroupToolbar.
		const _hasTemplateLock = selectedBlockClientIds.some(
			( id ) => getTemplateLock( id ) === 'contentOnly'
		);

		const _isZoomOut = isZoomOut();
		const _isSectionBlock = isSectionBlock( selectedBlockClientId );
		const _canEditBlock = canEditBlock( selectedBlockClientId );
		const _showSwitchSectionStyleButton =
			_canEditBlock && ( _isZoomOut || _isSectionBlock );

		const _currentDeviceType =
			getSettings()?.[ deviceTypeKey ]?.toLowerCase() || 'desktop';
		const _areSelectedBlocksHiddenOnViewport =
			selectedBlockClientIds.length > 0 &&
			selectedBlockClientIds.every( ( id ) =>
				isBlockHiddenAtViewport( id, _currentDeviceType )
			);
		const _isEditingResponsiveStyleState =
			!! selectedBlockClientId &&
			isResponsiveEditing() &&
			hasViewportBlockStyleState(
				getSelectedBlockStyleState( selectedBlockClientId )
			);

		return {
			blockClientId: selectedBlockClientId,
			blockClientIds: selectedBlockClientIds,
			isDefaultEditingMode: _isDefaultEditingMode,
			blockType: selectedBlockClientId && getBlockType( _blockName ),
			shouldShowVisualToolbar: isValid && isVisual,
			toolbarKey: `${ selectedBlockClientId }${ parentClientId }`,
			showParentSelector:
				! _isZoomOut &&
				parentBlockType &&
				( editingMode !== 'contentOnly' || !! parentSection ) &&
				getBlockEditingMode( parentClientId ) !== 'disabled' &&
				hasBlockSupport(
					parentBlockType,
					'__experimentalParentSelector',
					true
				) &&
				selectedBlockClientIds.length === 1,
			isUsingBindings: _isUsingBindings,
			isSectionContainer: _isSectionBlock,
			hasContentOnlyLocking: _hasTemplateLock,
			showShuffleButton: _isZoomOut,
			showSlots: ! _isZoomOut && ! _isEditingResponsiveStyleState,
			showStyleStateSlot: ! _isZoomOut && _isEditingResponsiveStyleState,
			showGroupButtons: ! _isZoomOut,
			showLockButtons: ! _isZoomOut,
			showBlockVisibilityButton: ! _isZoomOut,
			showSwitchSectionStyleButton: _showSwitchSectionStyleButton,
			areSelectedBlocksHiddenOnViewport:
				_areSelectedBlocksHiddenOnViewport,
			canEdit: _canEditBlock,
			isEditedSection:
				!! selectedBlockClientId &&
				getEditedContentOnlySection() === selectedBlockClientId,
			toolbarView: getBlockToolbarView( selectedBlockClientId ),
		};
	}, [] );

	const hasContentTools = useHasContentTools( showStyleStateSlot );

	const toolbarWrapperRef = useRef( null );

	// Handles highlighting the current block outline on hover or focus of the
	// block type toolbar area.
	const nodeRef = useRef();
	const showHoveredOrFocusedGestures = useShowHoveredOrFocusedGestures( {
		ref: nodeRef,
	} );

	const isLargeViewport = ! useViewportMatch( 'medium', '<' );

	const hasBlockToolbar = useHasBlockToolbar();
	const isPlaceholder = showPlaceholder && ! blockClientIds.length;
	if ( ! hasBlockToolbar && ! isPlaceholder ) {
		return null;
	}

	const isMultiToolbar = blockClientIds.length > 1;
	const isSynced =
		isReusableBlock( blockType ) || isTemplatePart( blockType );

	// With the block toolbar views experiment, a single "Edit" toggle either
	// unlocks an unsynced pattern section (replacing "Edit pattern") or swaps
	// the toolbar between block-level actions and the block's editing tools.
	// Synced patterns and template parts get no toggle: they are edited in
	// their own editor, through "Go to original".
	let editToggle = null;
	if (
		window.__experimentalBlockToolbarViews &&
		! isPlaceholder &&
		! isMultiToolbar &&
		! isSynced &&
		shouldShowVisualToolbar
	) {
		if ( isSectionContainer || isEditedSection ) {
			editToggle = canEdit ? 'section' : null;
		} else if ( ( showSlots || showStyleStateSlot ) && hasContentTools ) {
			editToggle = 'view';
		}
	}
	const hasToolbarViews = editToggle === 'view';
	const showBlockActions = ! hasToolbarViews || toolbarView === 'block';
	const showContentTools = ! hasToolbarViews || toolbarView === 'content';

	// Shifts the toolbar to make room for the parent block selector.
	const classes = clsx( 'block-editor-block-contextual-toolbar', {
		'has-parent': showParentSelector,
		'is-placeholder': isPlaceholder,
	} );

	const innerClasses = clsx( 'block-editor-block-toolbar', {
		'is-synced': isSynced,
		'is-connected': isUsingBindings,
	} );

	return (
		<NavigableToolbar
			focusEditorOnEscape
			shouldUseKeyboardFocusShortcut={ ! isPlaceholder }
			className={ classes }
			/* translators: accessibility text for the block toolbar */
			aria-label={ __( 'Block tools' ) }
			// The variant is applied as "toolbar" when undefined, which is the black border style of the dropdown from the toolbar popover.
			variant={ variant === 'toolbar' ? undefined : variant }
			focusOnMount={ focusOnMount }
			__experimentalInitialIndex={ __experimentalInitialIndex }
			__experimentalOnIndexChange={ __experimentalOnIndexChange }
			// Resets the index whenever the active block changes so
			// this is not persisted. See https://github.com/WordPress/gutenberg/pull/25760#issuecomment-717906169
			key={ toolbarKey }
		>
			<div ref={ toolbarWrapperRef } className={ innerClasses }>
				{ showParentSelector && ! isMultiToolbar && isLargeViewport && (
					<BlockParentSelector />
				) }
				{ ( shouldShowVisualToolbar ||
					isMultiToolbar ||
					isPlaceholder ) && (
					<div ref={ nodeRef } { ...showHoveredOrFocusedGestures }>
						<ToolbarGroup className="block-editor-block-toolbar__block-controls">
							<BlockToolbarIcon
								clientIds={ blockClientIds }
								isSynced={ isSynced }
							/>
							{ /* The toggle sits right after the block icon so it stays in place when the view changes. */ }
							{ editToggle && (
								<BlockEditToggle
									clientId={ blockClientId }
									isSection={ editToggle === 'section' }
								/>
							) }
							{ ! isPlaceholder &&
								isDefaultEditingMode &&
								showBlockVisibilityButton &&
								showBlockActions && (
									<ViewportVisibilityToolbar
										clientIds={ blockClientIds }
									/>
								) }
							{ ! isPlaceholder &&
								! isMultiToolbar &&
								isDefaultEditingMode &&
								showLockButtons &&
								showBlockActions && (
									<BlockLockToolbar
										clientId={ blockClientId }
									/>
								) }
							{ showBlockActions && (
								<BlockMover
									clientIds={ blockClientIds }
									hideDragHandle={ hideDragHandle }
								/>
							) }
						</ToolbarGroup>
					</div>
				) }
				{ ! areSelectedBlocksHiddenOnViewport &&
					! hasContentOnlyLocking &&
					shouldShowVisualToolbar &&
					isMultiToolbar &&
					showGroupButtons && <BlockGroupToolbar /> }
				{ ! window.__experimentalBlockToolbarViews &&
					! isPlaceholder &&
					! isMultiToolbar &&
					canEdit && (
						<EditSectionButton clientId={ blockClientIds[ 0 ] } />
					) }
				{ ! areSelectedBlocksHiddenOnViewport && showShuffleButton && (
					<ChangeDesign clientId={ blockClientIds[ 0 ] } />
				) }
				{ ! areSelectedBlocksHiddenOnViewport &&
					showSwitchSectionStyleButton && (
						<SwitchSectionStyle clientId={ blockClientIds[ 0 ] } />
					) }
				{ ! areSelectedBlocksHiddenOnViewport &&
					shouldShowVisualToolbar && (
						<>
							{ ! isSectionContainer && (
								<>
									{ showSlots && showBlockActions && (
										<BlockControls.Slot
											group="parent"
											className="block-editor-block-toolbar__slot"
										/>
									) }
									{ showSlots && showContentTools && (
										<>
											<BlockControls.Slot
												group="block"
												className="block-editor-block-toolbar__slot"
											/>
											<BlockControls.Slot className="block-editor-block-toolbar__slot" />
											<BlockControls.Slot
												group="inline"
												className="block-editor-block-toolbar__slot"
											/>
										</>
									) }
									{ showStyleStateSlot &&
										showContentTools && (
											<BlockControls.Slot
												group="style-state"
												className="block-editor-block-toolbar__slot"
											/>
										) }
								</>
							) }
							{ showSlots && (
								<>
									{ showContentTools && (
										<BlockControls.Slot
											group="other"
											className="block-editor-block-toolbar__slot"
										/>
									) }
									<__unstableBlockToolbarLastItem.Slot />
								</>
							) }
						</>
					) }
				<BlockEditVisuallyButton clientIds={ blockClientIds } />
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</div>
		</NavigableToolbar>
	);
}

/**
 * Private prop of BlockToolbar: while no block is selected, show the default
 * block's icon, the mover and the options menu, disabled.
 */
export const showPlaceholderKey = Symbol( 'showPlaceholder' );

/**
 * Renders the block toolbar.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-toolbar/README.md
 *
 * @param {Object}  props                Components props.
 * @param {boolean} props.hideDragHandle Show or hide the Drag Handle for drag and drop functionality.
 * @param {string}  props.variant        Style variant of the toolbar, also passed to the Dropdowns rendered from Block Toolbar Buttons.
 */
export default function BlockToolbar( props ) {
	const { hideDragHandle, variant } = props;
	return (
		<PrivateBlockToolbar
			hideDragHandle={ hideDragHandle }
			variant={ variant }
			showPlaceholder={ !! props[ showPlaceholderKey ] }
			focusOnMount={ undefined }
			__experimentalInitialIndex={ undefined }
			__experimentalOnIndexChange={ undefined }
		/>
	);
}
