module.exports = function( node ) {
	var tags = [];

	if ( node.since ) {
		var since_parts = node.since.split( " " );

		tags.push( {
			name: "since",
			content: since_parts[0] || "",
			description: since_parts.slice(1).join( " " ),
		} );
	}

	if ( node.deprecated && typeof node.deprecated === "string" ) {
		var deprecated_parts = node.deprecated.split( " " );

		tags.push( {
			name: "deprecated",
			content: deprecated_parts[0] || "",
			description: deprecated_parts.slice(1).join( " " ),
		} );
	}

	if ( node.deprecated && typeof node.deprecated !== "string" ) {
		tags.push( {
			name: "deprecated",
			content: "",
		} );
	}

	if ( node.params ) {
		for( var i = 0; i < node.params.length; i++ ) {
			var param = node.params[ i ];

			tags.push( {
				name: "param",
				content: param.description || "",
				types: param.type ? param.type.names : [ "mixed" ],
				variable: param.name,
			} )
		}
	}

	if ( node.returns && node.returns[0] ) {
		tags.push( {
			name: "return",
			content: node.returns[0].description || "",
			types: node.returns[0].type ? node.returns[0].type.names : [ "mixed" ],
		} );
	}

	return tags;
};
