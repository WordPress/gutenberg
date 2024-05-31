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
import BlockSwitcher from '../block-switcher';
import BlockControls from '../block-controls';
import __unstableBlockToolbarLastItem from './block-toolbar-last-item';
import BlockSettingsMenu from '../block-settings-menu';
import { BlockLockToolbar } from '../block-lock';
import { BlockGroupToolbar } from '../convert-to-group-buttons';
import BlockEditVisuallyButton from '../block-edit-visually-button';
import { useShowHoveredOrFocusedGestures } from './utils';
import { store as blockEditorStore } from '../../store';
import __unstableBlockNameContext from './block-name-context';
import NavigableToolbar from '../navigable-toolbar';
import Shuffle from './shuffle';
import BlockBindingsIndicator from '../block-bindings-toolbar-indicator';
import { useHasBlockToolbar } from './use-has-block-toolbar';
import { canBindBlock } from '../../hooks/use-bindings-attributes';
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
		blockName,
		toolbarKey,
		shouldShowVisualToolbar,
		showParentSelector,
		isUsingBindings,
	} = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockMode,
			getBlockParents,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getBlockEditingMode,
			getBlockAttributes,
		} = select( blockEditorStore );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const blockRootClientId = getBlockRootClientId( selectedBlockClientId );
		const parents = getBlockParents( selectedBlockClientId );
		const firstParentClientId = parents[ parents.length - 1 ];
		const parentBlockName = getBlockName( firstParentClientId );
		const parentBlockType = getBlockType( parentBlockName );
		const _isDefaultEditingMode =
			getBlockEditingMode( selectedBlockClientId ) === 'default';
		const _blockName = getBlockName( selectedBlockClientId );
		const isValid = selectedBlockClientIds.every( ( id ) =>
			isBlockValid( id )
		);
		const isVisual = selectedBlockClientIds.every(
			( id ) => getBlockMode( id ) === 'visual'
		);
		const _isUsingBindings = !! getBlockAttributes( selectedBlockClientId )
			?.metadata?.bindings;
		return {
			blockClientId: selectedBlockClientId,
			blockClientIds: selectedBlockClientIds,
			isDefaultEditingMode: _isDefaultEditingMode,
			blockName: _blockName,
			blockType: selectedBlockClientId && getBlockType( _blockName ),
			shouldShowVisualToolbar: isValid && isVisual,
			rootClientId: blockRootClientId,
			toolbarKey: `${ selectedBlockClientId }${ firstParentClientId }`,
			showParentSelector:
				parentBlockType &&
				getBlockEditingMode( firstParentClientId ) === 'default' &&
				hasBlockSupport(
					parentBlockType,
					'__experimentalParentSelector',
					true
				) &&
				selectedBlockClientIds.length === 1 &&
				_isDefaultEditingMode,
			isUsingBindings: _isUsingBindings,
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
				{ ! isMultiToolbar &&
					isLargeViewport &&
					isDefaultEditingMode && <BlockParentSelector /> }
				{ isUsingBindings && canBindBlock( blockName ) && (
					<BlockBindingsIndicator clientIds={ blockClientIds } />
				) }
				{ ( shouldShowVisualToolbar || isMultiToolbar ) &&
					( isDefaultEditingMode || isSynced ) && (
						<div
							ref={ nodeRef }
							{ ...showHoveredOrFocusedGestures }
						>
							<ToolbarGroup className="block-editor-block-toolbar__block-controls">
								<BlockSwitcher
									clientIds={ blockClientIds }
									disabled={ ! isDefaultEditingMode }
								/>
								{ isDefaultEditingMode && (
									<>
										{ ! isMultiToolbar && (
											<BlockLockToolbar
												clientId={ blockClientId }
											/>
										) }
										<BlockMover
											clientIds={ blockClientIds }
											hideDragHandle={ hideDragHandle }
										/>
									</>
								) }
							</ToolbarGroup>
						</div>
					) }
				<Shuffle clientId={ blockClientId } />
				{ shouldShowVisualToolbar && isMultiToolbar && (
					<BlockGroupToolbar />
				) }
				{ shouldShowVisualToolbar && (
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
						<BlockControls.Slot
							group="other"
							className="block-editor-block-toolbar__slot"
						/>
						<__unstableBlockNameContext.Provider
							value={ blockType?.name }
						>
							<__unstableBlockToolbarLastItem.Slot />
						</__unstableBlockNameContext.Provider>
					</>
				) }
				<BlockEditVisuallyButton clientIds={ blockClientIds } />
				{ isDefaultEditingMode && (
					<BlockSettingsMenu clientIds={ blockClientIds } />
				) }
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
