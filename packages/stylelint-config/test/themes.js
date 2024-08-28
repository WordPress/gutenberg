/**
 * @jest-environment node
 */
/**
 * External dependencies
 */
import fs from 'node:fs';
import stylelint from 'stylelint';

/**
 * Internal dependencies
 */
import config from '../stylistic';

const validCss = fs.readFileSync(
	'./packages/stylelint-config/test/themes-valid.css',
	'utf-8'
);

describe( 'flags no warnings with valid css', () => {
	let result;

	beforeEach( () => {
		result = stylelint.lint( {
			code: validCss,
			config,
		} );
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
