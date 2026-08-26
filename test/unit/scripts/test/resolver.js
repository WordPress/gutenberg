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
} );
