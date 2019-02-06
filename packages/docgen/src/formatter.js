/**
 * Internal dependencies
 */
const getParamType = require( './get-param-type-as-string' );

const formatParams = ( params, docs ) => {
	if ( params && params.length > 0 ) {
		docs.push( '**Parameters**' );
		docs.push( '\n' );
		docs.push( ...params.map(
			( param ) => `\n- **${ param.name }** \`(${ getParamType( param ) })\`: ${ cleanSpaces( param.description ) }`
		) );
		docs.push( '\n' );
	}
};

const cleanSpaces = ( paragraph ) =>
	paragraph.split( '\n' ).map(
		( sentence ) => sentence.trim()
	).reduce(
		( acc, current ) => acc + ' ' + current,
		''
	).trim();

const formatOutput = ( output, docs ) => {
	if ( output && output.length === 1 ) {
		docs.push( '**Returns**' );
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( `\`${ getParamType( output[ 0 ] ) }\` ${ cleanSpaces( output[ 0 ].description ) }` );
		docs.push( '\n' );
	}
};

module.exports = function( artifacts ) {
	const docs = [ '# API' ];
	docs.push( '\n' );
	docs.push( '\n' );
	if ( artifacts && artifacts.length > 0 ) {
		artifacts.forEach( ( artifact ) => {
			docs.push( `## ${ artifact.name }` );
			docs.push( '\n' );
			docs.push( '\n' );
			docs.push( cleanSpaces( artifact.description ) );
			docs.push( '\n' );
			docs.push( '\n' );
			formatParams( artifact.params, docs );
			docs.push( '\n' );
			formatOutput( artifact.return, docs );
			docs.push( '\n' );
		} );
		docs.pop(); // remove last \n, we want one blank line at the end of the file.
	} else {
		docs.push( 'Nothing to document.' );
		docs.push( '\n' );
	}
	return docs.join( '' );
};
