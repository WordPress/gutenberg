/**
 * Internal dependencies
 */
const getSymbolTagsByName = require( '../get-symbol-tags-by-name' );

const cleanSpaces = ( paragraph ) =>
	paragraph
		? paragraph
				.split( '\n' )
				.map( ( sentence ) => sentence.trim() )
				.reduce( ( acc, current ) => acc + ' ' + current, '' )
				.trim()
		: '';

const formatTag = ( title, tags, formatter, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( `*${ title }*` );
		docs.push( '\n' );
		docs.push( ...tags.map( ( tag ) => `\n${ formatter( tag ) }` ) );
	}
};

const formatExamples = ( tags, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( '*Usage*' );
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push(
			...tags.map( ( tag ) => `${ tag.description }` ).join( '\n\n' )
		);
	}
};

const formatDeprecated = ( tags, docs ) => {
	if ( tags && tags.length > 0 ) {
		docs.push( '\n' );
		docs.push(
			...tags.map(
				( tag ) =>
					`\n> **Deprecated** ${ cleanSpaces(
						`${ tag.name } ${ tag.description }`
					) }`
			)
		);
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

const getTypeOutput = ( tag ) => {
	if ( tag.optional ) {
		return `\`[${ tag.type }]\``;
	}
	return `\`${ tag.type }\``;
};

module.exports = (
	rootDir,
	docPath,
	symbols,
	headingTitle,
	headingStartIndex
) => {
	const docs = [];
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
			docs.push( getHeading( headingIndex, symbol.name ) );
			formatDeprecated(
				getSymbolTagsByName( symbol, 'deprecated' ),
				docs
			);
			formatDescription( symbol.description, docs );
			formatTag(
				'Related',
				getSymbolTagsByName( symbol, 'see', 'link' ),
				( tag ) => {
					const name = tag.name.trim();
					const desc = tag.description.trim();

					// prettier-ignore
					return desc
						? `- ${ name } ${ desc }`
						: `- ${ name }`;
				},
				docs
			);
			formatExamples( getSymbolTagsByName( symbol, 'example' ), docs );
			formatTag(
				'Type',
				getSymbolTagsByName( symbol, 'type' ),
				( tag ) => {
					const type = tag.type && getTypeOutput( tag );
					const desc = cleanSpaces(
						`${ tag.name } ${ tag.description }`
					);

					// prettier-ignore
					return type
						? `- ${ type }${ desc }`
						: `- ${ desc }`;
				},
				docs
			);
			formatTag(
				'Parameters',
				getSymbolTagsByName( symbol, 'param' ),
				( tag ) => {
					const name = tag.name;
					const type = tag.type && getTypeOutput( tag );
					const desc = cleanSpaces( tag.description );

					return type
						? `- *${ name }* ${ type }: ${ desc }`
						: `- *${ name }* ${ desc }`;
				},
				docs
			);
			formatTag(
				'Returns',
				getSymbolTagsByName( symbol, 'return' ),
				( tag ) => {
					const type = tag.type && getTypeOutput( tag );
					const desc = cleanSpaces(
						`${ tag.name } ${ tag.description }`
					);

					// prettier-ignore
					return type
						? `- ${ type }: ${ desc }`
						: `- ${ desc }`;
				},
				docs
			);
			formatTag(
				'Type Definition',
				getSymbolTagsByName( symbol, 'typedef' ),
				( tag ) => {
					const name = tag.name;
					const type = getTypeOutput( tag );

					return `- *${ name }* ${ type }`;
				},
				docs
			);
			formatTag(
				'Properties',
				getSymbolTagsByName( symbol, 'property' ),
				( tag ) => {
					const name = tag.name;
					const type = tag.type && getTypeOutput( tag );
					const desc = cleanSpaces( tag.description );

					// prettier-ignore
					return type
						? `- *${ name }* ${ type }: ${ desc }`
						: `- *${ name }* ${ desc }`
				},
				docs
			);
			docs.push( '\n' );
			docs.push( '\n' );
		} );
		docs.pop(); // Remove last \n, we want one blank line at the end of the file.
	} else {
		docs.push( 'Nothing to document.' );
		docs.push( '\n' );
	}
	return docs.join( '' );
};
