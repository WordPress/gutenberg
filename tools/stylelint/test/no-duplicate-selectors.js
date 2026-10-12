import { beforeAll, describe, expect, it } from 'vitest';
import { getStylelintResult } from './utils';

describe( 'allows duplicate selectors in scss', () => {
	let result;

	beforeAll( async () => {
		result = await getStylelintResult(
			'./no-duplicate-selectors-valid.scss'
		);
	} );

	it( 'did not error', () => {
		expect( result.errored ).toBeFalsy();
	} );

	it( 'flags no warnings', () => {
		expect( result.results[ 0 ].warnings ).toHaveLength( 0 );
	} );
} );

describe( 'flags warnings when duplicate selectors are found in css', () => {
	let result;

	beforeAll( async () => {
		result = await getStylelintResult(
			'./no-duplicate-selectors-invalid.css'
		);
	} );

	it( 'did error', () => {
		expect( result.errored ).toBeTruthy();
	} );

	it( 'flags correct number of warnings', () => {
		expect( result.results[ 0 ].warnings ).toHaveLength( 1 );
	} );

	it( 'snapshot matches warnings', () => {
		expect( result.results[ 0 ].warnings ).toMatchSnapshot();
	} );
} );
