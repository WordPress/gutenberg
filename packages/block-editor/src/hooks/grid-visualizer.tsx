import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { GridVisualizer, useGridLayoutSync } from '../components/grid';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';
import useBlockVisibility from '../components/block-visibility/use-block-visibility';
import { deviceTypeKey } from '../store/private-keys';
import { BLOCK_VISIBILITY_VIEWPORTS } from '../components/block-visibility/constants';
import type { BlockVisibilityViewport } from '../components/block-visibility/constants';
import type { Layout } from '../layouts/types';
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
	const { isVisible, blockVisibility, deviceType, viewportSettings } =
		useSelect(
			( select ) => {
				const {
					isBlockSelected,
					hasSelectedInnerBlock,
					isDraggingBlocks,
					getTemplateLock,
					getBlockEditingMode,
					getBlockAttributes,
					getSettings,
				} = select( blockEditorStore );

				// These calls are purposely ordered from least expensive to most expensive.
				// Hides the visualizer in cases where the user is not or cannot interact with it.
				// Also hide if a child block is selected, because layout-child.tsx will render
				// the visualizer in that case (with proper childGridClientId handling).
				if (
					( ! isDraggingBlocks() && ! isBlockSelected( clientId ) ) ||
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

				return {
					isVisible: true,
					blockVisibility: attributes?.metadata?.blockVisibility,
					deviceType: currentDeviceType,
					viewportSettings:
						settings?.__experimentalFeatures?.viewport,
				};
			},
			[ clientId ]
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
					<GridVisualizer
						clientId={ clientId }
						parentLayout={ layout }
					/>
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
