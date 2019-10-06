// https://html.spec.whatwg.org/entities.json
const ref = require( './named-character-entities-reference' );

const asUnicodeChars = ( s ) =>
	s
		.split( '' )
		.map(
			( c ) =>
				`\\u${ c
					.charCodeAt( 0 )
					.toString( 16 )
					.padStart( 4, '0' ) }`
		)
		.join( '' );

const [ nameToEntity, entityToName ] = Object.keys( ref )
	// .slice(0, 100)
	.filter( ( name ) => name.endsWith( ';' ) )
	.reduce(
		( pair, name ) => {
			const codePoints = asUnicodeChars( ref[ name ].characters );

			pair[ 0 ][ name ] = codePoints;
			pair[ 1 ][ codePoints ] = name;

			return pair;
		},
		[ {}, {} ]
	);

const nameToEntitySource = `export const nameToEntityMap = JSON.parse( '${ JSON.stringify(
	nameToEntity
) }' );`;
const entityToNameSource = `export const entityToNameMap = JSON.parse( '${ JSON.stringify(
	entityToName
) }' );`;

const nameToEntityPattern = `export const nameToEntityPattern = /${ Object.keys(
	nameToEntity
).join( '|' ) }/g;`;
const entityToNamePattern = `export const entityToNamePattern = /${ Object.keys(
	entityToName
)
	.map( ( s ) => s )
	.join( '|' ) }/g;`;

require( 'fs' ).writeFileSync(
	'named-character-entities.js',
	[
		nameToEntitySource,
		entityToNameSource,
		nameToEntityPattern,
		entityToNamePattern,
	].join( '\n\n' ),
	'utf8'
);
