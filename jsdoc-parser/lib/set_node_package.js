const path = require( "path" );

module.exports = function( node, packages_root, relative_path ) {
	var namespace = path.relative( packages_root, relative_path ).split( "/" )[0];

	if ( namespace ) {
		node.memberof = node.memberof ? ( [ namespace, node.memberof ].join( "." ) ) : namespace;
		node.longname = namespace + "." + node.longname;
	}

	return node;
};
