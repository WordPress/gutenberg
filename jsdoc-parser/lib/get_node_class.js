const getFileLineNumber = require( "./get_file_line_number" );
const getNodeDoc = require( "./get_node_doc" );

module.exports = function( file_path, node ) {
	var end_line = getFileLineNumber( file_path, node.meta.range ? node.meta.range[1] : -1 );

	return {
		name: node.name,
		namespace: node.memberof ? node.memberof.replace( /\./g, '\\' ) : "global",
		line: node.meta.lineno,
		end_line: end_line,
		final: false,
		abstract: node.virtual === true,
		extends: node.augments ? node.augments[0] : null,
		implements: node.mixes || [],
		properties: [],
		methods: [ {
			name: "constructor",
			namespace: "",
			aliases: [],
			line: node.meta.lineno,
			end_line: end_line,
			final: false,
			abstract: node.virtual === true,
			static: false,
			visibility: "public",
			arguments: ( node.params || [] ).map(
				function( param ) {
					return {
						name: param.name,
						default: param.defaultValue,
						type: param.type.names[0]
					}
				}
			),
			doc: getNodeDoc( node ),
		} ],
		doc: getNodeDoc( node ),
	};
};
