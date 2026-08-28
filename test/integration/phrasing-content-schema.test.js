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
