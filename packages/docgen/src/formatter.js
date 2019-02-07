/**
 * Internal dependencies
 */
const getParamType = require( './get-param-type-as-string' );

const cleanSpaces = ( paragraph ) =>
	paragraph ?
		paragraph.split( '\n' ).map(
			( sentence ) => sentence.trim()
		).reduce(
			( acc, current ) => acc + ' ' + current,
			''
		).trim() :
		'';

const formatParamTags = ( params, docs ) => {
	if ( params && params.length > 0 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( '**Parameters**' );
		docs.push( '\n' );
		docs.push( ...params.map(
			( param ) => `\n- **${ param.name }** \`${ getParamType( param ) }\`: ${ cleanSpaces( param.description ) }`
		) );
	}
};

const formatExampleTag = ( tags, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( '**Usage**' );
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( ...tags.map(
			( tag ) => `${ tag.description }`
		).join( '\n\n' ) );
	}
};

const formatReturnTag = ( output, docs ) => {
	if ( output && output.length === 1 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( '**Returns**' );
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( `\`${ getParamType( output[ 0 ] ) }\` ${ cleanSpaces( output[ 0 ].description ) }` );
	}
};

const formatSeeAndLinkTags = ( tags, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( '**Related**' );
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( ...tags.map(
			( tag ) => `\n- ${ tag.description }`
		) );
	}
};

module.exports = function( artifacts ) {
	const docs = [ '# API' ];
	docs.push( '\n' );
	docs.push( '\n' );
	artifacts.sort( ( first, second ) => {
		const firstName = first.name.toUpperCase();
		const secondName = second.name.toUpperCase();
		if ( firstName < secondName ) {
			return -1;
		}
		if ( firstName > secondName ) {
			return 1;
		}
		return 0;
	} );
	if ( artifacts && artifacts.length > 0 ) {
		artifacts.forEach( ( artifact ) => {
			docs.push( `## ${ artifact.name }` );
			docs.push( '\n' );
			docs.push( '\n' );
			docs.push( artifact.description );
			formatSeeAndLinkTags(
				artifact.tags.filter( ( tag ) => ( tag.title === 'see' ) || ( tag.title === 'link' ) ),
				docs
			);
			formatExampleTag( artifact.tags.filter( ( tag ) => tag.title === 'example' ), docs );
			formatParamTags( artifact.params, docs );
			formatReturnTag( artifact.return, docs );
			docs.push( '\n' );
			docs.push( '\n' );
		} );
		docs.pop(); // remove last \n, we want one blank line at the end of the file.
	} else {
		docs.push( 'Nothing to document.' );
		docs.push( '\n' );
	}
	return docs.join( '' );
};
