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
		docs.push( `*${ title }*` );
		docs.push( '\n' );
		docs.push( ...tags.map( formatter ) );
	}
};

const formatExamples = ( tags, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( '*Usage*' );
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

const getHeading = ( index, text ) => {
	return '#'.repeat( index ) + ' ' + text;
};

const getSymbolHeading = ( text ) => {
	return `<a name="${ text }" href="#${ text }">#</a> **${ text }**`;
};

module.exports = function( rootDir, docPath, symbols, headingTitle, headingStartIndex ) {
	const docs = [ ];
	let headingIndex = headingStartIndex || 1;
	if ( headingTitle ) {
		docs.push( getHeading( headingIndex, `${ headingTitle }` ) );
		headingIndex++;
	}
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
			docs.push( getSymbolHeading( symbol.name ) );
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
				( tag ) => `\n- \`${ tag.type }\` ${ cleanSpaces( tag.description ) }`,
				docs
			);
			formatTag(
				'Parameters',
				getTagsByName( symbol.tags, 'param' ),
				( tag ) => `\n- *${ tag.name }* \`${ tag.type }\`: ${ cleanSpaces( tag.description ) }`,
				docs
			);
			formatTag(
				'Returns',
				getTagsByName( symbol.tags, 'return' ),
				( tag ) => `\n- \`${ tag.type }\`: ${ cleanSpaces( tag.description ) }`,
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
