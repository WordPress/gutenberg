import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/no-components-color-variables.mjs';

const RULE_ID = 'gutenberg/no-components-color-variables';

const config = {
	languageOptions: {
		parserOptions: { ecmaFeatures: { jsx: true } },
	},
	plugins: {
		gutenberg: {
			rules: { 'no-components-color-variables': rule },
		},
	},
	rules: {
		[ RULE_ID ]: 'error',
	},
};

function lint( code ) {
	return new Linter().verify( code, config );
}

describe( 'no-components-color-variables', () => {
	it( 'reports reading a variable', () => {
		expect(
			lint(
				'const color = "var(--wp-components-color-accent)";\nconst border = `1px solid var(--wp-components-color-gray-300)`;'
			)
		).toEqual( [
			expect.objectContaining( { ruleId: RULE_ID, line: 1 } ),
			expect.objectContaining( { ruleId: RULE_ID, line: 2 } ),
		] );
	} );

	it( 'reports setting a variable', () => {
		expect(
			lint(
				'const style = { "--wp-components-color-accent": "red" };\nconst el = <div style={ { [ "--wp-components-color-background" ]: "white" } } />;'
			)
		).toEqual( [
			expect.objectContaining( { ruleId: RULE_ID, line: 1 } ),
			expect.objectContaining( { ruleId: RULE_ID, line: 2 } ),
		] );
	} );

	it( 'accepts other variables', () => {
		expect(
			lint(
				'const color = "var(--wpds-color-foreground-content-neutral)";\nconst accent = `var(--wp-admin-theme-color)`;'
			)
		).toEqual( [] );
	} );
} );
