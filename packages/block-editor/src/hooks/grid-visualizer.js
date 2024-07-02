/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { GridVisualizer } from '../components/grid';

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
