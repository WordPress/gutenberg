/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { GridVisualizer, useGridLayoutSync } from '../components/grid';
import { store as blockEditorStore } from '../store';
import useBlockVisibility from '../components/block-visibility/use-block-visibility';
import { deviceTypeKey } from '../store/private-keys';
import { BLOCK_VISIBILITY_VIEWPORTS } from '../components/block-visibility/constants';

function GridLayoutSync( props ) {
	useGridLayoutSync( props );
}

function GridTools( { clientId, layout } ) {
	const { isVisible, blockVisibility, deviceType } = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				isDraggingBlocks,
				getTemplateLock,
				getBlockEditingMode,
				getBlockAttributes,
				getSettings,
			} = select( blockEditorStore );

			// These calls are purposely ordered from least expensive to most expensive.
			// Hides the visualizer in cases where the user is not or cannot interact with it.
			if (
				( ! isDraggingBlocks() && ! isBlockSelected( clientId ) ) ||
				getTemplateLock( clientId ) ||
				getBlockEditingMode( clientId ) !== 'default'
			) {
				return { isVisible: false };
			}

			const attributes = getBlockAttributes( clientId );
			const settings = getSettings();

			return {
				isVisible: true,
				blockVisibility: attributes?.metadata?.blockVisibility,
				deviceType:
					settings?.[ deviceTypeKey ]?.toLowerCase() ||
					BLOCK_VISIBILITY_VIEWPORTS.desktop.value,
			};
		},
		[ clientId ]
	);

	const { isBlockCurrentlyHidden } = useBlockVisibility( {
		blockVisibility,
		deviceType,
	} );

	return (
		<>
			<GridLayoutSync clientId={ clientId } />
			{ isVisible && ! isBlockCurrentlyHidden && (
				<GridVisualizer clientId={ clientId } parentLayout={ layout } />
			) }
		</>
	);
}

const addGridVisualizerToBlockEdit = createHigherOrderComponent(
	( BlockEdit ) =>
		function AddGridVisualizerToBlockEdit( props ) {
			if ( props.attributes.layout?.type !== 'grid' ) {
				return <BlockEdit key="edit" { ...props } />;
			}

			return (
				<>
					<GridTools
						clientId={ props.clientId }
						layout={ props.attributes.layout }
					/>
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
