import { beforeAll, describe, expect, it } from 'vitest';
import stylelint from 'stylelint';
import scss from 'postcss-scss';
import plugin from '../no-token-fallback-values.mjs';
import { getStylelintResult } from './utils';

const CONFIG = {
	plugins: [ plugin ],
	rules: { 'plugin-wpds/no-token-fallback-values': true },
};

it( 'reports the correct fallback location after an SCSS line comment', async () => {
	const { results } = await stylelint.lint( {
		code: `a { --example: red // explanatory comment
 var(--wpds-border-radius-sm, 2px); }`,
		customSyntax: scss,
		config: CONFIG,
	} );

	expect( results[ 0 ].warnings ).toHaveLength( 1 );
	expect( results[ 0 ].warnings[ 0 ] ).toMatchObject( {
		line: 2,
		column: 2,
		endLine: 2,
		endColumn: 30,
	} );
} );

describe( 'flags no warnings with valid css (no wpds fallbacks)', () => {
	let result: ReturnType< typeof getStylelintResult >;

	beforeAll( () => {
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

	beforeAll( () => {
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
