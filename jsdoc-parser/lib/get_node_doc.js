const getNodeTags = require( "./get_node_tags" );

module.exports = function( node ) {
	var desc_parts = ( node.description || "" ).split( "\n" );
	var desc = desc_parts[0];
	var long_desc = desc_parts.slice( 1 ).join( "\n" );

	return {
		description: desc,
		long_description: long_desc,
		tags: getNodeTags( node ),
	};
};
