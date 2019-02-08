/**
 * Internal dependencies
 */
const getType = require( './get-type-as-string' );

const cleanSpaces = ( paragraph ) =>
	paragraph ?
		paragraph.split( '\n' ).map(
			( sentence ) => sentence.trim()
		).reduce(
			( acc, current ) => acc + ' ' + current,
			''
		).trim() :
		'';

const formatParamTags = ( tags, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( '**Parameters**' );
		docs.push( '\n' );
		docs.push( ...tags.map(
			( tag ) => `\n- **${ tag.name }** \`${ getType( tag ) }\`: ${ cleanSpaces( tag.description ) }`
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

const formatReturnTag = ( tag, docs ) => {
	if ( tag && tag.length === 1 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( '**Returns**' );
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( `\`${ getType( tag[ 0 ] ) }\` ${ cleanSpaces( tag[ 0 ].description ) }` );
	}
};

const formatTypeTag = ( tag, docs ) => {
	if ( tag && tag.length === 1 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( '**Type**' );
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( `\`${ getType( tag[ 0 ] ) }\` ${ cleanSpaces( tag[ 0 ].description ) }` );
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

const formatDeprecated = ( tags, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push( ...tags.map(
			( tag ) => `\n> **Deprecated** ${ cleanSpaces( tag.description ) }`
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
			formatDeprecated( artifact.tags.filter( ( tag ) => tag.title === 'deprecated' ), docs );
			docs.push( '\n' );
			docs.push( '\n' );
			docs.push( artifact.description );
			formatSeeAndLinkTags(
				artifact.tags.filter( ( tag ) => ( tag.title === 'see' ) || ( tag.title === 'link' ) ),
				docs
			);
			formatExampleTag( artifact.tags.filter( ( tag ) => tag.title === 'example' ), docs );
			formatTypeTag( artifact.tags.filter( ( tag ) => tag.title === 'type' ), docs );
			formatParamTags( artifact.tags.filter( ( tag ) => tag.title === 'param' ), docs );
			formatReturnTag( artifact.tags.filter( ( tag ) => tag.title === 'return' ), docs );
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
