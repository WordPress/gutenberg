/* eslint-disable import/order -- The transformer must load after its dependency is mocked. */
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );

const mockGetCacheKey = jest.fn( ( source ) => source );

jest.mock( 'babel-jest', () => ( {
	createTransformer: () => ( {
		getCacheKey: mockGetCacheKey,
	} ),
} ) );

const transformer = require( '../babel-transformer' );
/* eslint-enable import/order */

describe( 'Babel transformer cache key', () => {
	let temporaryDirectory;

	afterEach( () => {
		mockGetCacheKey.mockClear();
		if ( temporaryDirectory ) {
			fs.rmSync( temporaryDirectory, { force: true, recursive: true } );
			temporaryDirectory = undefined;
		}
	} );

	it.each( [ 'js', 'jsx' ] )(
		'includes block.json for block index.%s files',
		( extension ) => {
			temporaryDirectory = fs.mkdtempSync(
				path.join( os.tmpdir(), 'gutenberg-babel-transformer-' )
			);
			const blockDirectory = path.join(
				temporaryDirectory,
				'block-library',
				'src',
				'example'
			);
			fs.mkdirSync( blockDirectory, { recursive: true } );
			fs.writeFileSync(
				path.join( blockDirectory, 'block.json' ),
				'{"name":"core/example"}'
			);

			const cacheKey = transformer.getCacheKey(
				'block source',
				path.join( blockDirectory, `index.${ extension }` )
			);

			expect( cacheKey ).toBe( 'block source\n{"name":"core/example"}' );
		}
	);
} );
