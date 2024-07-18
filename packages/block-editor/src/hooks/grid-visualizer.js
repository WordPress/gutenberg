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
	const { isSelected, isDragging } = useSelect( ( select ) => {
		const { isBlockSelected, isDraggingBlocks } =
			select( blockEditorStore );

		return {
			isSelected: isBlockSelected( clientId ),
			isDragging: isDraggingBlocks(),
		};
	} );

	return (
		<>
			<GridLayoutSync clientId={ clientId } />
			{ ( isSelected || isDragging ) && (
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
