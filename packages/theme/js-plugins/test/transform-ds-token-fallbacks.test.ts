import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { transformDsTokenFallbacks } from '../transform-ds-token-fallbacks.mjs';

const gap = 'var(--wpds-dimension-gap-sm, 8px)';
const font =
	'var(--wpds-typography-font-family-mono, "Menlo", "Consolas", monaco, monospace)';

function evaluate( source: string ) {
	const result = transformDsTokenFallbacks( source, 'fixture.js' );
	return runInNewContext( result?.code ?? source );
}

describe( 'JavaScript token fallbacks', () => {
	it( 'adds fallbacks to string and template values without changing their escapes', () => {
		const source = String.raw`[
			'var(--wpds-typography-font-family-mono)',
			"var(--wpds-typography-font-family-mono)",
			'line\nvar(--wpds-dimension-gap-sm)\\path\'quote',
			'var(--wpds-dimension-\u0067ap-sm)'
		]`;
		expect( evaluate( source ) ).toEqual( [
			font,
			font,
			`line\n${ gap }\\path'quote`,
			gap,
		] );
		expect(
			evaluate(
				'`line\\nvar(--wpds-dimension-gap-sm)\\\\path\\`quoted\\${literal}`'
			)
		).toBe( `line\n${ gap }\\path\`quoted\${literal}` );
	} );

	it( 'preserves String.raw and tagged-template escapes', () => {
		expect(
			evaluate(
				'String.raw`line\\nvar(--wpds-typography-font-family-mono)`'
			)
		).toBe( `line\\n${ font }` );
		expect(
			evaluate(
				'((strings) => [ strings[0], strings.raw[0] ])`line\\nvar(--wpds-typography-font-family-mono)`'
			)
		).toEqual( [ `line\n${ font }`, `line\\n${ font }` ] );
	} );

	it( 'transforms static template parts and expression values without joining dynamic token names', () => {
		expect(
			evaluate(
				'`var(--wpds-dimension-gap-sm) ${"var(--wpds-border-radius-sm)"}`'
			)
		).toBe( `${ gap } var(--wpds-border-radius-sm, 2px)` );
		expect(
			evaluate( 'const size = "sm"; `var(--wpds-dimension-gap-${size})`' )
		).toBe( 'var(--wpds-dimension-gap-sm)' );
	} );

	it( 'ignores comments, regexes, names, module paths, JSX text, and TypeScript types', () => {
		const source = String.raw`
// var(--wpds-not-a-token)
/* var(--wpds-not-a-token) */
import 'var(--wpds-not-a-token)';
export { x as 'var(--wpds-not-a-token)' } from 'var(--wpds-not-a-token)';
const pattern = /var(--wpds-not-a-token)/;
const object = { 'var(--wpds-not-a-token)': 1 };
object['var(--wpds-not-a-token)'];
const lazy = () => import('var(--wpds-not-a-token)');
const cjs = require('var(--wpds-not-a-token)');
type Token = 'var(--wpds-not-a-token)';
type Template = \`var(--wpds-not-a-token)\`;
const element = <div>var(--wpds-not-a-token)</div>;
`.replaceAll( '\\`', '`' );
		expect( transformDsTokenFallbacks( source, 'fixture.tsx' ) ).toBeNull();
	} );

	it( 'encodes JSX attribute fallbacks as JavaScript expressions', () => {
		const result = transformDsTokenFallbacks(
			'<div title="var(--wpds-typography-font-family-mono) &amp; test" />',
			'fixture.jsx'
		);
		expect( result?.code ).toBe(
			`<div title={${ JSON.stringify( `${ font } & test` ) }} />`
		);
	} );

	it( 'preserves manual fallbacks and is idempotent', () => {
		const source =
			'const value = "var(--wpds-dimension-gap-sm,) var(--wpds-border-radius-sm, 99px)";';
		expect( transformDsTokenFallbacks( source, 'fixture.js' ) ).toBeNull();
		const result = transformDsTokenFallbacks(
			'const value = "var(--wpds-dimension-gap-sm)";',
			'fixture.js'
		);
		expect( result ).not.toBeNull();
		expect(
			transformDsTokenFallbacks( result!.code, 'fixture.js' )
		).toBeNull();
	} );

	it( 'reports unknown tokens in values', () => {
		expect( () =>
			transformDsTokenFallbacks(
				'const value = "var(--wpds-not-a-token)";',
				'fixture.ts'
			)
		).toThrow( 'Unknown design token: --wpds-not-a-token' );
	} );
} );
