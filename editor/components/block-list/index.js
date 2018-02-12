/**
 * External dependencies
 */
import { connect } from 'react-redux';
import {
	filter,
	get,
	map,
} from 'lodash';
/**
 * Internal dependencies
 */
import './style.scss';
import BlockListLayout from './layout';
import { getBlocks } from '../../store/selectors';

function BlockList( {
	blocks,
	renderBlockMenu,
	layouts = {},
	rootUID,
	showContextualToolbar,
} ) {
	// BlockList can be provided with a layouts configuration, either grouped
	// (blocks adjacent in markup) or ungrouped. This is inferred by the shape
	// of the layouts configuration passed (grouped layout as array).
	const isGroupedByLayout = Array.isArray( layouts );

	// In case of ungrouped layout, we still emulate a layout merely for the
	// purposes of normalizing layout rendering, even though there will only
	// be a single layout, and no filtering applied.
	if ( ! isGroupedByLayout ) {
		layouts = [ { name: 'default' } ];
	}

	return map( layouts, ( layout ) => {
		// When rendering grouped layouts, filter to blocks assigned to layout.
		const layoutBlocks = isGroupedByLayout ?
			filter( blocks, ( block ) => (
				get( block, [ 'attributes', 'layout' ] ) === layout.name
			) ) :
			blocks;

		return (
			<BlockListLayout
				key={ layout.name }
				layout={ layout.name }
				isGroupedByLayout={ isGroupedByLayout }
				blocks={ layoutBlocks }
				renderBlockMenu={ renderBlockMenu }
				rootUID={ rootUID }
				showContextualToolbar={ showContextualToolbar }
			/>
		);
	} );
}

export default connect(
	( state, ownProps ) => ( {
		blocks: getBlocks( state, ownProps.rootUID ),
	} ),
)( BlockList );
