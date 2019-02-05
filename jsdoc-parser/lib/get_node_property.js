const getFileLineNumber = require( "./get_file_line_number" );
const getNodeDoc = require( "./get_node_doc" );

module.exports = function( file_path, node ) {
	var end_line = getFileLineNumber( file_path, node.meta.range[1] );

	return {
		name: node.name,
		line: node.meta.lineno,
		end_line: end_line,
		default: null,
		static: node.scope === "static",
		visibility: "public",
		doc: getNodeDoc( node ),
	};
};
