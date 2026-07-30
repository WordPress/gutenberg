/**
 * @jest-environment node
 */
import plugin from '../../../stylelint-plugins/no-global-css-defense-custom-properties.mjs';
import { getStylelintResult } from './utils';

const CONFIG = {
	plugins: [ plugin ],
	rules: { 'plugin-wpds/no-global-css-defense-custom-properties': true },
};

describe( 'flags no warnings with valid css (no global CSS defense tokens)', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeAll( () => {
		result = getStylelintResult(
			'./fixtures/no-global-css-defense-custom-properties-valid.css',
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

describe( 'flags warnings with invalid global CSS defense custom properties css', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeAll( () => {
		result = getStylelintResult(
			'./fixtures/no-global-css-defense-custom-properties-invalid.css',
			CONFIG
		);
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 5 )
		);
	} );

	it( 'snapshot matches warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toMatchSnapshot()
		);
	} );
} );
