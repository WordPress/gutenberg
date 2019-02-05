const getFileLineNumber = require( "./get_file_line_number" );
const getNodeDoc = require( "./get_node_doc" );

module.exports = function( file_path, node, namespace ) {
	var end_line = node.meta.range ?
		getFileLineNumber( file_path, node.meta.range[1] ) :
		node.meta.lineno;

	return {
		name: node.name,
		namespace: namespace === undefined ? "global" : namespace.replace( /\./g, '\\' ),
		aliases: [],
		line: node.meta.lineno,
		end_line: end_line,
		final: false,
		abstract: node.virtual === true,
		static: node.scope === "static",
		visibility: "public",
		arguments: ( node.params || [] ).map(
			function( param ) {
				return {
					name: param.name,
					default: param.defaultValue || null,
					type: param.type ? param.type.names[0] : "mixed"
				}
			}
		),
		doc: getNodeDoc( node ),
		hooks: [],
	};
};
