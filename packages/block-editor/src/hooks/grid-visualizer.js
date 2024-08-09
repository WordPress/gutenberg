/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { createContext, forwardRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { GridVisualizer, useGridLayoutSync } from '../components/grid';
import { store as blockEditorStore } from '../store';

export const GridResizerBoundsContext = createContext();

function GridLayoutSync( props ) {
	useGridLayoutSync( props );
}

const GridTools = forwardRef( ( { clientId, layout }, ref ) => {
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

	return (
		<>
			<GridLayoutSync clientId={ clientId } />
			{ ( hasSelection || isDragging ) && (
				<GridVisualizer
					clientId={ clientId }
					parentLayout={ layout }
					contentRef={ ref }
				/>
			) }
		</>
	);
} );

const addGridVisualizerToBlockEdit = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		// Use useState() instead of useRef() so that GridItemResizer updates when ref is set.
		const [ resizerBounds, setResizerBounds ] = useState();

		if ( props.attributes.layout?.type !== 'grid' ) {
			return <BlockEdit key="edit" { ...props } />;
		}

		return (
			<GridResizerBoundsContext.Provider value={ resizerBounds }>
				<GridTools
					clientId={ props.clientId }
					layout={ props.attributes.layout }
					ref={ setResizerBounds }
				/>
				<BlockEdit key="edit" { ...props } />
			</GridResizerBoundsContext.Provider>
		);
	},
	'addGridVisualizerToBlockEdit'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/grid-visualizer',
	addGridVisualizerToBlockEdit
);
