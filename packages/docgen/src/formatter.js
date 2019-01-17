module.exports = function( artifacts ) {
	const docs = [ '# API' ];
	docs.push( '\n' );
	docs.push( '\n' );
	artifacts.forEach( ( artifact ) => {
		docs.push( `## ${ artifact.name }` );
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( artifact.description.replace( '\n', ' ' ) );
		docs.push( '\n' );
		docs.push( '\n' );
	} );
	docs.pop(); // remove last \n, we want one blank line at the end of the file.
	return docs.join( '' );
};
