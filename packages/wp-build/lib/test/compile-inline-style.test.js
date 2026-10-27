import { describe, expect, test } from 'vitest';
import { compileCss, compileInlineStyle } from '../compile-inline-style.mjs';

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
	test( 'applies design token fallbacks by default', async () => {
		const source = await compileInlineStyle( { minify: false } )(
			'.fixture { gap: var(--wpds-dimension-gap-sm); }',
			import.meta.dirname,
			`${ import.meta.dirname }/fixture.css`
		);

		expect( source ).toContain( 'var(--wpds-dimension-gap-sm, 8px)' );
	} );

	test( 'skips generated style injection in test mode', async () => {
		const source = await compileStyleModule();

		expect(
			executeStyleModule( source, {
				env: { NODE_ENV: 'test' },
			} )
		).toBe( 0 );
	} );

	test( 'injects generated styles outside test mode', async () => {
		const source = await compileStyleModule();

		expect(
			executeStyleModule( source, {
				env: { NODE_ENV: 'development' },
			} )
		).toBe( 1 );
	} );

	test( 'injects generated styles when process is absent', async () => {
		const source = await compileStyleModule();

		expect( executeStyleModule( source, undefined ) ).toBe( 1 );
	} );
} );

describe( 'compileCss', () => {
	test( 'scopes class names like the JavaScript module does', async () => {
		const cssText = '.button { color: red; } .is-small { padding: 0; }';
		const filePath = `${ import.meta.dirname }/fixture.module.css`;

		const { css, classNames } = await compileCss( cssText, filePath, {
			cssModules: true,
		} );
		const source = await compileInlineStyle( { cssModules: true } )(
			cssText,
			import.meta.dirname,
			filePath
		);

		expect( Object.keys( classNames ) ).toEqual( [ 'button', 'is-small' ] );
		expect( source ).toContain(
			`export default ${ JSON.stringify( classNames ) };`
		);
		expect( css ).toContain( `.${ classNames.button }` );
	} );
} );
