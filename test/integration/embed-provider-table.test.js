import fs from 'fs';
import path from 'path';
import variations from '../../packages/block-library/src/embed/variations';

const PHP_FILE = path.join(
	__dirname,
	'../../lib/experimental/block-transforms/class-gutenberg-embed-transforms.php'
);

/**
 * One provider entry as written in the PHP table.
 *
 * The table is formatted by `phpcbf`, so the shape is stable: a slug, a list of
 * single-quoted patterns, a boolean, and an optional type.
 */
const PROVIDER = new RegExp(
	"'([a-z0-9-]+)'\\s*=> array\\(\\s*" +
		"'patterns'\\s*=> array\\(([\\s\\S]*?)\\),\\s*" +
		"'attributes'\\s*=> array\\(([\\s\\S]*?)\\),\\s*" +
		"(?:'type'\\s*=> '([a-z]+)',\\s*)?" +
		'\\),',
	'g'
);

/**
 * One attribute as written in the PHP table.
 */
const ATTRIBUTE = /'([a-zA-Z]+)'\s*=> (true|false|'([^']*)'),/g;

/**
 * Reads the provider table out of the PHP source.
 *
 * @return {Object[]} Providers, in the order the file lists them.
 */
function readPHPProviders() {
	const source = fs.readFileSync( PHP_FILE, 'utf8' );

	return Array.from( source.matchAll( PROVIDER ) ).map(
		( [ , slug, patterns, attributes, type ] ) => ( {
			slug,
			patterns: Array.from( patterns.matchAll( /'(#.*#[a-z]*)',/g ) ).map(
				( [ , pattern ] ) => ( {
					source: pattern.slice( 1, pattern.lastIndexOf( '#' ) ),
					flags: pattern.slice( pattern.lastIndexOf( '#' ) + 1 ),
				} )
			),
			attributes: Object.fromEntries(
				Array.from( attributes.matchAll( ATTRIBUTE ) ).map(
					( [ , name, value, string ] ) => [
						name,
						undefined === string ? 'true' === value : string,
					]
				)
			),
			type,
		} )
	);
}

/**
 * Reads the same table out of the block variations the editor matches against.
 *
 * @return {Object[]} Providers, in the order the editor tries them.
 */
function readEditorProviders() {
	return variations
		.filter( ( { patterns } ) => patterns?.length )
		.map( ( { name, patterns, attributes } ) => ( {
			slug: name,
			patterns: patterns.map( ( { source, flags } ) => ( {
				source,
				flags,
			} ) ),
			attributes,
		} ) );
}

describe( 'The embed providers PHP conversion matches URLs against', () => {
	const server = readPHPProviders();
	const editor = readEditorProviders();

	it( 'reads as a table', () => {
		// A table the regular expression above could not read would compare
		// equal to an empty one, so nothing else here would fail.
		expect( server.length ).toBeGreaterThan( 0 );
	} );

	it( 'lists the same providers the editor does, in the same order', () => {
		// The first pattern to match wins in both, so the order is part of
		// what the two have to agree on.
		expect( server.map( ( { slug } ) => slug ) ).toEqual(
			editor.map( ( { slug } ) => slug )
		);
	} );

	it( 'matches the same URLs, and reads the same attributes off them', () => {
		// Everything but the type, which the editor has no counterpart for.
		expect( server.map( ( { type, ...provider } ) => provider ) ).toEqual(
			editor
		);
	} );

	it( 'records an oEmbed type the block can save', () => {
		// `save` writes the type into a class name, so a value the editor
		// would never produce would be markup it cannot validate.
		for ( const { type } of server ) {
			expect( [ undefined, 'rich', 'photo', 'video', 'link' ] ).toContain(
				type
			);
		}
	} );
} );
