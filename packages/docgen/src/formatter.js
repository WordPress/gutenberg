/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * Internal dependencies
 */
const getType = require( './get-type-as-string' );

const getTagsByName = ( tags, ...names ) => tags.filter( ( tag ) => names.some( ( name ) => name === tag.title ) );

const cleanSpaces = ( paragraph ) =>
	paragraph ?
		paragraph.split( '\n' ).map(
			( sentence ) => sentence.trim()
		).reduce(
			( acc, current ) => acc + ' ' + current,
			''
		).trim() :
		'';

const formatTag = ( title, tags, formatter, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( `**${ title }**` );
		docs.push( '\n' );
		docs.push( ...tags.map( formatter ) );
	}
};

const formatExamples = ( tags, docs ) => {
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

const formatDeprecated = ( tags, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push( ...tags.map(
			( tag ) => `\n> **Deprecated** ${ cleanSpaces( tag.description ) }`
		) );
	}
};

const formatDescription = ( description, docs ) => {
	docs.push( '\n' );
	docs.push( '\n' );
	docs.push( description );
};

module.exports = function( symbols ) {
	const docs = [ '# API' ];
	docs.push( '\n' );
	docs.push( '\n' );
	symbols.sort( ( first, second ) => {
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
	if ( symbols && symbols.length > 0 ) {
		symbols.forEach( ( symbol ) => {
			const symbolPath = path.basename( symbol.path );
			const symbolPathWithLines = `${ symbolPath }#L${ symbol.lineStart }-L${ symbol.lineEnd }`;
			docs.push( `## ${ symbol.name }` );
			docs.push( `\n\n[${ symbolPathWithLines }](${ symbolPathWithLines })` );
			formatDeprecated( getTagsByName( symbol.tags, 'deprecated' ), docs );
			formatDescription( symbol.description, docs );
			formatTag(
				'Related',
				getTagsByName( symbol.tags, 'see', 'link' ),
				( tag ) => `\n- ${ tag.description }`,
				docs
			);
			formatExamples( getTagsByName( symbol.tags, 'example' ), docs );
			formatTag(
				'Type',
				getTagsByName( symbol.tags, 'type' ),
				( tag ) => `\n\`${ getType( tag ) }\` ${ cleanSpaces( tag.description ) }`,
				docs
			);
			formatTag(
				'Parameters',
				getTagsByName( symbol.tags, 'param' ),
				( tag ) => `\n- **${ tag.name }** \`${ getType( tag ) }\`: ${ cleanSpaces( tag.description ) }`,
				docs
			);
			formatTag(
				'Returns',
				getTagsByName( symbol.tags, 'return' ),
				( tag ) => `\n\`${ getType( tag ) }\` ${ cleanSpaces( tag.description ) }`,
				docs
			);
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
