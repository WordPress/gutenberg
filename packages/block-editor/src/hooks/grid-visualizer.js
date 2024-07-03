/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { GridVisualizer, useGridLayoutSync } from '../components/grid';

function GridLayoutSync( props ) {
	useGridLayoutSync( props );
}

const addGridVisualizerToBlockEdit = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if (
			! props.attributes?.layout ||
			props.attributes.layout?.type !== 'grid'
		) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<GridVisualizer
					clientId={ props.clientId }
					parentLayout={ props.attributes.layout }
				/>
				<GridLayoutSync clientId={ props.clientId } />

				<BlockEdit { ...props } />
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
