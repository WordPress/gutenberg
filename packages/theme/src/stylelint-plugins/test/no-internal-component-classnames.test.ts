/**
 * @jest-environment node
 */
import plugin from '../../../stylelint-plugins/no-internal-component-classnames.mjs';
import { getStylelintResult } from './utils';

const CONFIG = {
	plugins: [ plugin ],
	rules: { 'plugin-wpds/no-internal-component-classnames': true },
};

describe( 'flags no warnings with valid css', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeAll( () => {
		result = getStylelintResult(
			'./fixtures/no-internal-component-classnames-valid.css',
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

describe( 'flags warnings with invalid css', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeAll( () => {
		result = getStylelintResult(
			'./fixtures/no-internal-component-classnames-invalid.css',
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

describe( 'flags warnings with invalid scss', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeAll( () => {
		result = getStylelintResult(
			'./fixtures/no-internal-component-classnames-invalid.scss',
			CONFIG
		);
	} );

	it( 'did error', () => {
		return result.then( ( data ) => expect( data.errored ).toBeTruthy() );
	} );

	it( 'flags correct number of warnings', () => {
		return result.then( ( data ) =>
			expect( data.results[ 0 ].warnings ).toHaveLength( 1 )
		);
	} );
} );
