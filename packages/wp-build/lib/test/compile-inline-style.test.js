import { describe, expect, test } from 'vitest';
import { compileInlineStyle } from '../compile-inline-style.mjs';

async function compileStyleModule() {
	return compileInlineStyle( { minify: false } )(
		'.fixture { color: rgb(1, 2, 3); }',
		import.meta.dirname,
		`${ import.meta.dirname }/fixture.css`
	);
}

function executeStyleModule( source, processValue ) {
	let injectedStyleCount = 0;
	const document = {
		createElement: () => ( {
			appendChild() {},
			setAttribute() {},
		} ),
		createTextNode: () => ( {} ),
		head: {
			appendChild: () => {
				injectedStyleCount++;
			},
			querySelector: () => null,
		},
	};

	new Function( 'document', 'process', source )( document, processValue );

	return injectedStyleCount;
}

describe( 'compileInlineStyle', () => {
	test( 'skips generated style injection when the opt-out is true', async () => {
		const source = await compileStyleModule();

		expect(
			executeStyleModule( source, {
				env: {
					NODE_ENV: 'development',
					WP_TESTS_SKIP_STYLE_INJECTION: 'true',
				},
			} )
		).toBe( 0 );
	} );

	test( 'injects generated styles when the opt-out is false in test mode', async () => {
		const source = await compileStyleModule();

		expect(
			executeStyleModule( source, {
				env: {
					NODE_ENV: 'test',
					WP_TESTS_SKIP_STYLE_INJECTION: 'false',
				},
			} )
		).toBe( 1 );
	} );

	test( 'keeps the test-mode skip when the opt-out is absent', async () => {
		const source = await compileStyleModule();

		expect(
			executeStyleModule( source, {
				env: { NODE_ENV: 'test' },
			} )
		).toBe( 0 );
	} );

	test( 'injects generated styles when process is absent', async () => {
		const source = await compileStyleModule();

		expect( executeStyleModule( source, undefined ) ).toBe( 1 );
	} );
} );
