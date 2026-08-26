const nodePath = require( 'node:path' );
const resolver = require( '../resolver' );

describe( 'unit test resolver', () => {
	it( 'resolves WordPress source imports without package exports', () => {
		const defaultResolver = jest.fn( ( request ) => request );

		resolver( '@wordpress/block-editor/src/hooks/list-view', {
			defaultResolver,
			rootDir: process.cwd(),
		} );

		expect( defaultResolver ).toHaveBeenCalledWith(
			nodePath.join(
				process.cwd(),
				'packages',
				'block-editor',
				'src',
				'hooks/list-view'
			),
			expect.any( Object )
		);
	} );

	it( 'falls back from a JavaScript specifier to a TypeScript source file', () => {
		const defaultResolver = jest.fn( ( request ) => {
			if ( request.endsWith( '.js' ) ) {
				throw new Error( 'Module not found' );
			}

			return `${ request }.ts`;
		} );

		expect(
			resolver( './module.js', {
				defaultResolver,
				rootDir: process.cwd(),
			} )
		).toBe( './module.ts' );
		expect( defaultResolver ).toHaveBeenNthCalledWith(
			1,
			'./module.js',
			expect.any( Object )
		);
		expect( defaultResolver ).toHaveBeenNthCalledWith(
			2,
			'./module',
			expect.any( Object )
		);
	} );
} );
