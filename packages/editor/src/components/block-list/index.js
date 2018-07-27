/**
 * External dependencies
 */
import {
	reduce,
	get,
	map,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import BlockListLayout from './layout';

const UngroupedLayoutBlockList = withSelect(
	( select, ownProps ) => ( {
		blockClientIds: select( 'core/editor' ).getBlockOrder( ownProps.rootClientId ),
	} )
)( BlockListLayout );

const GroupedLayoutBlockList = withSelect(
	( select, ownProps ) => ( {
		blocks: select( 'core/editor' ).getBlocks( ownProps.rootClientId ),
	} ),
)( ( {
	blocks,
	layouts,
	...props
} ) => map( layouts, ( layout ) => {
	deprecated( 'grouped layout', {
		alternative: 'intermediary nested inner blocks',
		version: '3.5',
		plugin: 'Gutenberg',
		hint: 'See core Columns / Column block for reference implementation',
	} );

	// Filter blocks assigned to layout when rendering grouped layouts.
	const layoutBlockClientIds = reduce( blocks, ( result, block ) => {
		if ( get( block, [ 'attributes', 'layout' ] ) === layout.name ) {
			result.push( block.clientId );
		}

		return result;
	}, [] );

	return (
		<BlockListLayout
			key={ layout.name }
			layout={ layout.name }
			isGroupedByLayout
			blockClientIds={ layoutBlockClientIds }
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
