/**
 * @jest-environment node
 */
import plugin from '../no-setting-wpds-custom-properties.mjs';
import { getStylelintResult } from './utils';

const CONFIG = {
	plugins: [ plugin ],
	rules: { 'plugin-wpds/no-setting-wpds-custom-properties': true },
};

describe( 'flags no warnings with valid wpds custom properties css', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeAll( () => {
		result = getStylelintResult(
			'./fixtures/no-setting-wpds-custom-properties-valid.css',
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

describe( 'flags warnings with invalid wpds custom properties css', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeAll( () => {
		result = getStylelintResult(
			'./fixtures/no-setting-wpds-custom-properties-invalid.css',
			CONFIG
		);
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 2 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
