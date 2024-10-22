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

function GridLayoutSync( props ) {
	useGridLayoutSync( props );
}

function GridTools( { clientId, layout } ) {
	const isVisible = useSelect(
		( select ) => {
			const {
				isBlockSelected,
				isDraggingBlocks,
				getTemplateLock,
				getBlockEditingMode,
			} = select( blockEditorStore );

			// These calls are purposely ordered from least expensive to most expensive.
			// Hides the visualizer in cases where the user is not or cannot interact with it.
			if (
				( ! isDraggingBlocks() && ! isBlockSelected( clientId ) ) ||
				getTemplateLock( clientId ) ||
				getBlockEditingMode( clientId ) !== 'default'
			) {
				return false;
			}

			return true;
		},
		[ clientId ]
	);

	return (
		<>
			<GridLayoutSync clientId={ clientId } />
			{ isVisible && (
				<GridVisualizer clientId={ clientId } parentLayout={ layout } />
			) }
		</>
	);
}

const addGridVisualizerToBlockEdit = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
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
