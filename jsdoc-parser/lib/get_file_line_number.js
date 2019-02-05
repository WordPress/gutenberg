const fs = require( "fs" );
const getLineFromPos = require( "get-line-from-pos" );

module.exports = function( file_path, position ) {
	var fileContents = fs.readFileSync( file_path, "utf-8" );

	return getLineFromPos( fileContents, position );
};
