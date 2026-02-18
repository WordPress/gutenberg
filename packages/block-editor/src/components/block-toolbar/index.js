/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
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
import { ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockParentSelector from '../block-parent-selector';
import BlockControls from '../block-controls';
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
import { unlock } from '../../lock-unlock';
import { deviceTypeKey } from '../../store/private-keys';
import BlockToolbarIcon from './block-toolbar-icon';

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
 */
export function PrivateBlockToolbar( {
	hideDragHandle,
	focusOnMount,
	__experimentalInitialIndex,
	__experimentalOnIndexChange,
	variant = 'unstyled',
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
	} = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockMode,
			getBlockParents,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockEditingMode,
			getBlockAttributes,
			getSettings,
			getTemplateLock,
			getParentSectionBlock,
			isZoomOut,
			isSectionBlock,
			isBlockHiddenAtViewport,
		} = unlock( select( blockEditorStore ) );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const parents = getBlockParents( selectedBlockClientId );
		const parentSection = getParentSectionBlock( selectedBlockClientId );
		const parentClientId = parentSection ?? parents[ parents.length - 1 ];
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
		const _isUsingBindings = selectedBlockClientIds.every(
			( clientId ) =>
				!! getBlockAttributes( clientId )?.metadata?.bindings
		);

		// If one or more selected blocks are locked, do not show the BlockGroupToolbar.
		const _hasTemplateLock = selectedBlockClientIds.some(
			( id ) => getTemplateLock( id ) === 'contentOnly'
		);

		const _isZoomOut = isZoomOut();
		const _isSectionBlock = isSectionBlock( selectedBlockClientId );
		const _showSwitchSectionStyleButton = _isZoomOut || _isSectionBlock;

		const _currentDeviceType =
			getSettings()?.[ deviceTypeKey ]?.toLowerCase() || 'desktop';
		const _areSelectedBlocksHiddenOnViewport =
			selectedBlockClientIds.length > 0 &&
			selectedBlockClientIds.every( ( id ) =>
				isBlockHiddenAtViewport( id, _currentDeviceType )
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
				editingMode !== 'contentOnly' &&
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
			showSlots: ! _isZoomOut,
			showGroupButtons: ! _isZoomOut,
			showLockButtons: ! _isZoomOut,
			showBlockVisibilityButton: ! _isZoomOut,
			showSwitchSectionStyleButton: _showSwitchSectionStyleButton,
			areSelectedBlocksHiddenOnViewport:
				_areSelectedBlocksHiddenOnViewport,
		};
	}, [] );

	const toolbarWrapperRef = useRef( null );

	// Handles highlighting the current block outline on hover or focus of the
	// block type toolbar area.
	const nodeRef = useRef();
	const showHoveredOrFocusedGestures = useShowHoveredOrFocusedGestures( {
		ref: nodeRef,
	} );

	const isLargeViewport = ! useViewportMatch( 'medium', '<' );

	const hasBlockToolbar = useHasBlockToolbar();
	if ( ! hasBlockToolbar ) {
		return null;
	}

	const isMultiToolbar = blockClientIds.length > 1;
	const isSynced =
		isReusableBlock( blockType ) || isTemplatePart( blockType );

	// Shifts the toolbar to make room for the parent block selector.
	const classes = clsx( 'block-editor-block-contextual-toolbar', {
		'has-parent': showParentSelector,
	} );

	const innerClasses = clsx( 'block-editor-block-toolbar', {
		'is-synced': isSynced,
		'is-connected': isUsingBindings,
	} );

	return (
		<NavigableToolbar
			focusEditorOnEscape
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
				{ ( shouldShowVisualToolbar || isMultiToolbar ) && (
					<div ref={ nodeRef } { ...showHoveredOrFocusedGestures }>
						<ToolbarGroup className="block-editor-block-toolbar__block-controls">
							<BlockToolbarIcon
								clientIds={ blockClientIds }
								isSynced={ isSynced }
							/>
							{ isDefaultEditingMode &&
								showBlockVisibilityButton && (
									<ViewportVisibilityToolbar
										clientIds={ blockClientIds }
									/>
								) }
							{ ! isMultiToolbar &&
								isDefaultEditingMode &&
								showLockButtons && (
									<BlockLockToolbar
										clientId={ blockClientId }
									/>
								) }
							<BlockMover
								clientIds={ blockClientIds }
								hideDragHandle={ hideDragHandle }
							/>
						</ToolbarGroup>
					</div>
				) }
				{ ! areSelectedBlocksHiddenOnViewport &&
					! hasContentOnlyLocking &&
					shouldShowVisualToolbar &&
					isMultiToolbar &&
					showGroupButtons && <BlockGroupToolbar /> }
				{ ! isMultiToolbar && (
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
					shouldShowVisualToolbar &&
					showSlots && (
						<>
							{ ! isSectionContainer && (
								<>
									<BlockControls.Slot
										group="parent"
										className="block-editor-block-toolbar__slot"
									/>
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
							<BlockControls.Slot
								group="other"
								className="block-editor-block-toolbar__slot"
							/>
							<__unstableBlockToolbarLastItem.Slot />
						</>
					) }
				<BlockEditVisuallyButton clientIds={ blockClientIds } />
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</div>
		</NavigableToolbar>
	);
}

/**
 * Renders the block toolbar.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-toolbar/README.md
 *
 * @param {Object}  props                Components props.
 * @param {boolean} props.hideDragHandle Show or hide the Drag Handle for drag and drop functionality.
 * @param {string}  props.variant        Style variant of the toolbar, also passed to the Dropdowns rendered from Block Toolbar Buttons.
 */
export default function BlockToolbar( { hideDragHandle, variant } ) {
	return (
		<PrivateBlockToolbar
			hideDragHandle={ hideDragHandle }
			variant={ variant }
			focusOnMount={ undefined }
			__experimentalInitialIndex={ undefined }
			__experimentalOnIndexChange={ undefined }
		/>
	);
}
