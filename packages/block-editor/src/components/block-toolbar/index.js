/**
 * External dependencies
 */
import classnames from 'classnames';

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
	isUnmodifiedDefaultBlock,
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
import { useHasAnyBlockControls } from '../block-controls/use-has-block-controls';

const BlockToolbar = ( {
	hideDragHandle,
	isFixed, // TODO: Remove isFixed. That is a temporary prop to support the old fixed toolbar. All toolbars will be "fixed"/don't care about this distinction.
	variant,
} ) => {
	const {
		blockClientId,
		blockClientIds,
		blockEditingMode,
		blockType,
		hasParents,
		isEmptyDefaultBlock,
		isValid,
		isVisual,
		showParentSelector,
	} = useSelect( ( select ) => {
		const {
			getBlock,
			getBlockName,
			getBlockMode,
			getBlockParents,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getBlockEditingMode,
		} = select( blockEditorStore );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const blockRootClientId = getBlockRootClientId( selectedBlockClientId );
		const parents = getBlockParents( selectedBlockClientId );
		const firstParentClientId = parents[ parents.length - 1 ];
		const parentBlockName = getBlockName( firstParentClientId );
		const parentBlockType = getBlockType( parentBlockName );
		return {
			blockClientId: selectedBlockClientId,
			blockClientIds: selectedBlockClientIds,
			blockEditingMode: getBlockEditingMode( selectedBlockClientId ),
			blockType:
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) ),

			hasParents: parents.length,
			isEmptyDefaultBlock: isUnmodifiedDefaultBlock(
				getBlock( selectedBlockClientId ) || {}
			),
			isValid: selectedBlockClientIds.every( ( id ) =>
				isBlockValid( id )
			),
			isVisual: selectedBlockClientIds.every(
				( id ) => getBlockMode( id ) === 'visual'
			),
			rootClientId: blockRootClientId,
			showParentSelector:
				parentBlockType &&
				getBlockEditingMode( firstParentClientId ) === 'default' &&
				hasBlockSupport(
					parentBlockType,
					'__experimentalParentSelector',
					true
				) &&
				selectedBlockClientIds.length <= 1 &&
				getBlockEditingMode( selectedBlockClientId ) === 'default',
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

	const isToolbarEnabled =
		blockType &&
		hasBlockSupport( blockType, '__experimentalToolbar', true );
	const hasAnyBlockControls = useHasAnyBlockControls();

	if (
		isEmptyDefaultBlock ||
		! isToolbarEnabled ||
		( blockEditingMode !== 'default' && ! hasAnyBlockControls )
	) {
		return null;
	}

	const shouldShowVisualToolbar = isValid && isVisual;
	const isMultiToolbar = blockClientIds.length > 1;
	const isSynced =
		isReusableBlock( blockType ) || isTemplatePart( blockType );

	// Shifts the toolbar to make room for the parent block selector.
	const classes = classnames( 'block-editor-block-contextual-toolbar', {
		'has-parent': hasParents && showParentSelector,
		'is-fixed': isFixed,
	} );

	const innerClasses = classnames( 'block-editor-block-toolbar', {
		'is-synced': isSynced,
	} );

	return (
		<NavigableToolbar
			focusEditorOnEscape
			className={ classes }
			/* translators: accessibility text for the block toolbar */
			aria-label={ __( 'Block tools' ) }
			variant={ variant }
			// Resets the index whenever the active block changes so
			// this is not persisted. See https://github.com/WordPress/gutenberg/pull/25760#issuecomment-717906169
			key={ blockClientId }
		>
			<div ref={ toolbarWrapperRef } className={ innerClasses }>
				{ ! isMultiToolbar &&
					isLargeViewport &&
					blockEditingMode === 'default' && <BlockParentSelector /> }
				{ ( shouldShowVisualToolbar || isMultiToolbar ) &&
					blockEditingMode === 'default' && (
						<div
							ref={ nodeRef }
							{ ...showHoveredOrFocusedGestures }
						>
							<ToolbarGroup className="block-editor-block-toolbar__block-controls">
								<BlockSwitcher clientIds={ blockClientIds } />
								{ ! isMultiToolbar && (
									<BlockLockToolbar
										clientId={ blockClientIds[ 0 ] }
										wrapperRef={ toolbarWrapperRef }
									/>
								) }
								<BlockMover
									clientIds={ blockClientIds }
									hideDragHandle={ hideDragHandle }
								/>
							</ToolbarGroup>
						</div>
					) }
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
				{ blockEditingMode === 'default' && (
					<BlockSettingsMenu clientIds={ blockClientIds } />
				) }
			</div>
		</NavigableToolbar>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-toolbar/README.md
 */
export default BlockToolbar;
