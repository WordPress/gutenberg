/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
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
import { useShowMoversGestures } from './utils';
import { store as blockEditorStore } from '../../store';
import __unstableBlockNameContext from './block-name-context';

const BlockToolbar = ( { hideDragHandle } ) => {
	const {
		blockClientIds,
		blockClientId,
		blockType,
		hasFixedToolbar,
		isDistractionFree,
		isValid,
		isVisual,
		isContentLocked,
	} = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockMode,
			getSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
			getSettings,
			__unstableGetContentLockingParent,
		} = select( blockEditorStore );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const blockRootClientId = getBlockRootClientId( selectedBlockClientId );
		const settings = getSettings();

		return {
			blockClientIds: selectedBlockClientIds,
			blockClientId: selectedBlockClientId,
			blockType:
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) ),
			hasFixedToolbar: settings.hasFixedToolbar,
			isDistractionFree: settings.isDistractionFree,
			rootClientId: blockRootClientId,
			isValid: selectedBlockClientIds.every( ( id ) =>
				isBlockValid( id )
			),
			isVisual: selectedBlockClientIds.every(
				( id ) => getBlockMode( id ) === 'visual'
			),
			isContentLocked: !! __unstableGetContentLockingParent(
				selectedBlockClientId
			),
		};
	}, [] );

	// Handles highlighting the current block outline on hover or focus of the
	// block type toolbar area.
	const { toggleBlockHighlight } = useDispatch( blockEditorStore );
	const nodeRef = useRef();
	const { showMovers, gestures: showMoversGestures } = useShowMoversGestures(
		{
			ref: nodeRef,
			onChange( isFocused ) {
				if ( isFocused && isDistractionFree ) {
					return;
				}
				toggleBlockHighlight( blockClientId, isFocused );
			},
		}
	);

	// Account for the cases where the block toolbar is rendered within the
	// header area and not contextually to the block.
	const displayHeaderToolbar =
		useViewportMatch( 'medium', '<' ) || hasFixedToolbar;

	if ( blockType ) {
		if ( ! hasBlockSupport( blockType, '__experimentalToolbar', true ) ) {
			return null;
		}
	}

	const shouldShowMovers = displayHeaderToolbar || showMovers;

	if ( blockClientIds.length === 0 ) {
		return null;
	}

	const shouldShowVisualToolbar = isValid && isVisual;
	const isMultiToolbar = blockClientIds.length > 1;
	const isSynced =
		isReusableBlock( blockType ) || isTemplatePart( blockType );

	const classes = classnames( 'block-editor-block-toolbar', {
		'is-showing-movers': shouldShowMovers,
		'is-synced': isSynced,
	} );

	return (
		<div className={ classes }>
			{ ! isMultiToolbar &&
				! displayHeaderToolbar &&
				! isContentLocked && <BlockParentSelector /> }
			<div ref={ nodeRef } { ...showMoversGestures }>
				{ ( shouldShowVisualToolbar || isMultiToolbar ) &&
					! isContentLocked && (
						<ToolbarGroup className="block-editor-block-toolbar__block-controls">
							<BlockSwitcher clientIds={ blockClientIds } />
							{ ! isMultiToolbar && (
								<BlockLockToolbar
									clientId={ blockClientIds[ 0 ] }
								/>
							) }
							<BlockMover
								clientIds={ blockClientIds }
								hideDragHandle={ hideDragHandle }
							/>
						</ToolbarGroup>
					) }
			</div>
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
			{ ! isContentLocked && (
				<BlockSettingsMenu clientIds={ blockClientIds } />
			) }
		</div>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-toolbar/README.md
 */
export default BlockToolbar;
