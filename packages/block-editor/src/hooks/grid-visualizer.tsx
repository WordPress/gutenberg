import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import {
	GridVisualizer,
	GridRowResizer,
	useGridLayoutSync,
} from '../components/grid';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import useBlockVisibility from '../components/block-visibility/use-block-visibility';
import { deviceTypeKey } from '../store/private-keys';
import { BLOCK_VISIBILITY_VIEWPORTS } from '../components/block-visibility/constants';
import type { BlockVisibilityViewport } from '../components/block-visibility/constants';
import type { Layout, LayoutBlockSupport } from '../layouts/types';
import type {
	BlockEditHookProps,
	GridLayoutSyncProps,
	GridVisualizerToolsProps,
} from './types';

function GridLayoutSync( props: GridLayoutSyncProps ) {
	useGridLayoutSync( props );
	return undefined;
}

function GridTools( { clientId, layout }: GridVisualizerToolsProps ) {
	const {
		isVisible,
		showRowResizer,
		blockVisibility,
		deviceType,
		viewportSettings,
	} = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				hasSelectedInnerBlock,
				isDraggingBlocks,
				isDragging: isDraggingAnything,
				getTemplateLock,
				getBlockEditingMode,
				getBlockAttributes,
				getBlockRootClientId,
				getBlockName,
				getSettings,
			} = unlock( select( blockEditorStore ) );
			// Blocks dragged from the canvas can be dropped in any grid, and
			// with grid interactivity, so can blocks dragged from an inserter,
			// which the grid tells apart by the drag's data types.
			const isDragging =
				isDraggingBlocks() ||
				( !! window.__experimentalEnableGridInteractivity &&
					isDraggingAnything() );

			// These calls are purposely ordered from least expensive to most expensive.
			// Hides the visualizer in cases where the user is not or cannot interact with it.
			// Also hide if a child block is selected, because layout-child.tsx will render
			// the visualizer in that case (with proper childGridClientId handling).
			if (
				( ! isDragging && ! isBlockSelected( clientId ) ) ||
				getTemplateLock( clientId ) ||
				getBlockEditingMode( clientId ) !== 'default' ||
				hasSelectedInnerBlock( clientId )
			) {
				return { isVisible: false };
			}

			const attributes = getBlockAttributes( clientId );
			const settings = getSettings();
			// Device types are capitalized viewport names.
			const currentDeviceType = ( settings?.[
				deviceTypeKey
			]?.toLowerCase() ||
				BLOCK_VISIBILITY_VIEWPORTS.desktop
					.key ) as BlockVisibilityViewport;

			// Rows are added and removed from the edges of a selected manual
			// grid. A grid that is an item of a grid sizing its items already
			// has the item resizer's handles on those edges, so it changes
			// rows in the block settings instead.
			const parentClientId = getBlockRootClientId( clientId );
			const isSizedByParentGrid =
				!! parentClientId &&
				// The layout attribute holds the block's layout.
				(
					getBlockAttributes( parentClientId )?.layout as
						Layout | undefined
				 )?.type === 'grid' &&
				!! (
					getBlockSupport(
						// A block with a layout has a name.
						getBlockName( parentClientId ) as string,
						'layout'
					) as LayoutBlockSupport | undefined
				 )?.allowSizingOnChildren;

			return {
				isVisible: true,
				showRowResizer:
					!! window.__experimentalEnableGridInteractivity &&
					!! layout?.isManualPlacement &&
					! isDragging &&
					isBlockSelected( clientId ) &&
					! isSizedByParentGrid,
				blockVisibility: attributes?.metadata?.blockVisibility,
				deviceType: currentDeviceType,
				viewportSettings: settings?.__experimentalFeatures?.viewport,
			};
		},
		[ clientId, layout ]
	);

	// Get the block's DOM element to derive the canvas iframe window,
	// so viewport detection matches the actual block rendering context
	const blockElement = useBlockElement( clientId );
	const rawCanvasView = blockElement?.ownerDocument?.defaultView;
	const canvasView = rawCanvasView === null ? undefined : rawCanvasView;

	const { isBlockCurrentlyHidden, currentViewport } = useBlockVisibility( {
		blockVisibility,
		deviceType,
		view: canvasView,
		viewportSettings,
	} );

	// Check whether any ancestor is hidden at the viewport actually detected
	// from the canvas, so it stays consistent with how blocks are hidden.
	const isAnyAncestorHidden = useSelect(
		( select ) => {
			if ( ! isVisible ) {
				return false;
			}
			const { isBlockParentHiddenAtViewport } = unlock(
				select( blockEditorStore )
			);
			return isBlockParentHiddenAtViewport( clientId, currentViewport );
		},
		[ clientId, currentViewport, isVisible ]
	);

	return (
		<>
			<GridLayoutSync clientId={ clientId } />
			{ isVisible &&
				! isBlockCurrentlyHidden &&
				! isAnyAncestorHidden && (
					<>
						<GridVisualizer
							clientId={ clientId }
							parentLayout={ layout }
						/>
						{ showRowResizer && (
							<GridRowResizer clientId={ clientId } />
						) }
					</>
				) }
		</>
	);
}

const addGridVisualizerToBlockEdit = createHigherOrderComponent(
	( BlockEdit ) =>
		function AddGridVisualizerToBlockEdit( props: BlockEditHookProps ) {
			// The layout attribute holds the block's layout.
			const layout = props.attributes.layout as Layout | undefined;
			if ( layout?.type !== 'grid' ) {
				return <BlockEdit key="edit" { ...props } />;
			}

			return (
				<>
					<GridTools clientId={ props.clientId } layout={ layout } />
					<BlockEdit key="edit" { ...props } />
				</>
			);
		},
	'addGridVisualizerToBlockEdit'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/grid-visualizer',
	addGridVisualizerToBlockEdit
);
