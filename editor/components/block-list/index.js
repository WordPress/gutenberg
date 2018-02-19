/**
 * External dependencies
 */
import { connect } from 'react-redux';
import {
	reduce,
	get,
	map,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockListLayout from './layout';
import { getBlocks, getBlockOrder } from '../../store/selectors';

const UngroupedLayoutBlockList = connect(
	( state, ownProps ) => ( {
		blockUIDs: getBlockOrder( state, ownProps.rootUID ),
	} )
)( BlockListLayout );

const GroupedLayoutBlockList = connect(
	( state, ownProps ) => ( {
		blocks: getBlocks( state, ownProps.rootUID ),
	} ),
)( ( {
	blocks,
	layouts,
	...props
} ) => map( layouts, ( layout ) => {
	// Filter blocks assigned to layout when rendering grouped layouts.
	const layoutBlockUIDs = reduce( blocks, ( result, block ) => {
		if ( get( block, [ 'attributes', 'layout' ] ) === layout.name ) {
			result.push( block.uid );
		}

		return result;
	}, [] );

	return (
		<BlockListLayout
			key={ layout.name }
			layout={ layout.name }
			isGroupedByLayout
			blockUIDs={ layoutBlockUIDs }
			{ ...props }
		/>
	);
} ) );

const BlockList = ( props ) => createElement(
	// BlockList can be provided with a layouts configuration, either grouped
	// (blocks adjacent in markup) or ungrouped. This is inferred by the shape
	// of the layouts configuration passed (grouped layout as array).
	Array.isArray( props.layouts ) ?
		GroupedLayoutBlockList :
		UngroupedLayoutBlockList,
	props
);

export default BlockList;
