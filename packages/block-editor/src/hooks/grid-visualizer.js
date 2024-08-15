/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { createContext, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { GridVisualizer, useGridLayoutSync } from '../components/grid';
import { store as blockEditorStore } from '../store';

export const GridResizerBoundsContext = createContext();

function GridLayoutSync( props ) {
	useGridLayoutSync( props );
}

function GridTools( { clientId, layout, children } ) {
	const { hasSelection, isDragging } = useSelect( ( select ) => {
		const { isBlockSelected, hasSelectedInnerBlock, isDraggingBlocks } =
			select( blockEditorStore );

		return {
			hasSelection:
				isBlockSelected( clientId ) ||
				hasSelectedInnerBlock( clientId ),
			isDragging: isDraggingBlocks(),
		};
	} );

	// Use useState() instead of useRef() so that GridItemResizer updates when ref is set.
	const [ resizerBounds, setResizerBounds ] = useState();

	return (
		<GridResizerBoundsContext.Provider value={ resizerBounds }>
			<GridLayoutSync clientId={ clientId } />
			{ ( hasSelection || isDragging ) && (
				<GridVisualizer
					clientId={ clientId }
					parentLayout={ layout }
					contentRef={ setResizerBounds }
				/>
			) }
			{ children }
		</GridResizerBoundsContext.Provider>
	);
}

const addGridVisualizerToBlockEdit = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.attributes.layout?.type !== 'grid' ) {
			return <BlockEdit key="edit" { ...props } />;
		}

		return (
			<GridTools
				clientId={ props.clientId }
				layout={ props.attributes.layout }
			>
				<BlockEdit key="edit" { ...props } />
			</GridTools>
		);
	},
	'addGridVisualizerToBlockEdit'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/grid-visualizer',
	addGridVisualizerToBlockEdit
);
