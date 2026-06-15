import { getStylelintResult } from './utils';

const CONFIG = './.stylelintrc.no-token-fallback-values.json';

describe( 'flags no warnings with valid css (no wpds fallbacks)', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeEach( () => {
		result = getStylelintResult(
			'./fixtures/no-token-fallback-values-valid.css',
			CONFIG
		);
	} );

	it( 'did not error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeFalsy() );
	} );

	it( 'flags no warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 0 )
		);
	} );
} );

describe( 'flags warnings with invalid css (wpds fallbacks)', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeEach( () => {
		result = getStylelintResult(
			'./fixtures/no-token-fallback-values-invalid.css',
			CONFIG
		);
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 6 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
