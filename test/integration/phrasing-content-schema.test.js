/**
 * `normalise()` on the server decides what belongs inside a paragraph from its
 * own copy of the editor's phrasing content list, because PHP cannot read
 * `@wordpress/dom`. This test fails when the two drift apart.
 */
import fs from 'fs';
import path from 'path';
import {
	getPhrasingContentSchema,
	isPhrasingContent,
} from '../../packages/dom/src/phrasing-content';

const PHP_FILE = path.join(
	__dirname,
	'../../lib/experimental/block-transforms/class-gutenberg-html-to-blocks.php'
);

describe( 'phrasing content', () => {
	const source = fs.readFileSync( PHP_FILE, 'utf8' );
	const body = source.match(
		/\tconst PHRASING_CONTENT = array\(([\s\S]*?)\n\t\);/
	);
	const php = Array.from(
		( body?.[ 1 ] ?? '' ).matchAll( /'([^']*)'/g )
	).map( ( [ , tag ] ) => tag );

	it( 'names the same tags as `isPhrasingContent`', () => {
		// The tags the editor answers true for: everything the phrasing content
		// schema names, plus `span`, which the schema leaves out on purpose so
		// that filtering unwraps it.
		const js = [
			...Object.keys( getPhrasingContentSchema() ).filter(
				( tag ) => tag !== '#text'
			),
			'span',
		];

		expect( [ ...php ].sort() ).toEqual( [ ...js ].sort() );
	} );

	it( 'is read the same way by the editor', () => {
		expect( php.length ).toBeGreaterThan( 0 );

		php.forEach( ( tag ) => {
			expect( {
				[ tag ]: isPhrasingContent( { nodeName: tag.toUpperCase() } ),
			} ).toEqual( { [ tag ]: true } );
		} );
	} );
} );

describe( 'phrasing content schema', () => {
	/**
	 * The full schema — attributes and nesting, not just tag names — pinned by
	 * `fixtures/block-transforms/phrasing-content-schema.json`, which
	 * `Gutenberg_Block_Transforms_Test` holds against the server's
	 * `get_phrasing_content_schema()`. A change to either copy that does not
	 * touch the fixture fails here or there.
	 */
	const fixture = JSON.parse(
		fs.readFileSync(
			path.join(
				__dirname,
				'fixtures/block-transforms/phrasing-content-schema.json'
			),
			'utf8'
		)
	);
	const schema = getPhrasingContentSchema();
	const textLevelTags = Object.keys( fixture.textLevel );

	it( 'contains the text-level and embedded elements, nothing else', () => {
		expect( Object.keys( schema ).sort() ).toEqual(
			[ ...textLevelTags, ...Object.keys( fixture.embedded ) ].sort()
		);
	} );

	it( 'keeps the attributes the fixture declares', () => {
		[ fixture.textLevel, fixture.embedded ].forEach( ( group ) => {
			Object.entries( group ).forEach( ( [ tag, definition ] ) => {
				expect( {
					[ tag ]: schema[ tag ].attributes,
				} ).toEqual( { [ tag ]: definition.attributes } );
			} );
		} );
	} );

	it( 'nests every text-level element in every other, plus an image', () => {
		textLevelTags
			.filter( ( tag ) => ! fixture.childless.includes( tag ) )
			.forEach( ( tag ) => {
				const children = schema[ tag ].children;
				const expected = [
					...textLevelTags.filter( ( other ) => other !== tag ),
					'img',
				];

				expect( { [ tag ]: Object.keys( children ).sort() } ).toEqual( {
					[ tag ]: expected.sort(),
				} );
			} );

		// The nesting recurses: an element excludes only itself, one level at
		// a time, so `strong > em > strong` is allowed while `strong > strong`
		// is not.
		expect( schema.strong.children.em.children.strong ).toBeDefined();
		expect( schema.strong.children.strong ).toBeUndefined();
	} );

	it( 'gives the childless elements no children', () => {
		fixture.childless.forEach( ( tag ) => {
			expect( schema[ tag ].children ).toBeUndefined();
		} );
	} );

	it( 'lets math hold anything', () => {
		expect( schema.math.children ).toBe( '*' );
	} );
} );
