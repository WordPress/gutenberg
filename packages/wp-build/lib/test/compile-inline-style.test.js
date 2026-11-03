import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { compileInlineStyle } from '../compile-inline-style.mjs';

async function compileStyleModule() {
	return compileInlineStyle( { minify: false } )(
		'.fixture { color: rgb(1, 2, 3); }',
		import.meta.dirname,
		`${ import.meta.dirname }/fixture.css`
	);
}

async function compileCssModule( cssText, filePath ) {
	const source = await compileInlineStyle( {
		cssModules: true,
		minify: false,
	} )( cssText, path.dirname( filePath ), filePath );

	return {
		css: JSON.parse( source.match( /registerStyle\("\w+", (.*)\);/ )[ 1 ] ),
		classNames: JSON.parse( source.match( /export default (.*);/ )[ 1 ] ),
	};
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

	describe( 'CSS module class names', () => {
		let dir;

		beforeEach( async () => {
			dir = await mkdtemp( path.join( tmpdir(), 'wp-build-css-' ) );
		} );

		afterEach( async () => {
			await rm( dir, { recursive: true, force: true } );
		} );

		test( 'are valid identifiers that keep the local name', async () => {
			const { classNames } = await compileCssModule(
				'.tab { color: red; }',
				path.join( dir, 'style.module.css' )
			);

			expect( classNames.tab ).toMatch(
				/^(?:_\d|[a-f])[0-9a-f]{15}__tab$/
			);
		} );

		test( 'change when the CSS of their file changes', async () => {
			const filePath = path.join( dir, 'style.module.css' );
			const before = await compileCssModule(
				'.tab { color: red; }',
				filePath
			);
			const unchanged = await compileCssModule(
				'.tab { color: red; }',
				filePath
			);
			const changed = await compileCssModule(
				'.tab { color: blue; }',
				filePath
			);

			expect( unchanged.classNames ).toEqual( before.classNames );
			expect( changed.classNames.tab ).not.toBe( before.classNames.tab );
		} );

		test( 'change when a file reached through `composes` changes', async () => {
			const filePath = path.join( dir, 'style.module.css' );
			const cssText =
				'.dialog { composes: header from "./shared.module.css"; color: red; }';
			const sharedPath = path.join( dir, 'shared.module.css' );

			await writeFile(
				sharedPath,
				'.header { gap: var(--wpds-dimension-gap-sm); }'
			);
			const before = await compileCssModule( cssText, filePath );
			await writeFile(
				sharedPath,
				'.header { gap: var(--wpds-dimension-gap-md); }'
			);
			const after = await compileCssModule( cssText, filePath );

			const [ ownBefore, sharedBefore ] =
				before.classNames.dialog.split( ' ' );
			const [ ownAfter, sharedAfter ] =
				after.classNames.dialog.split( ' ' );

			expect( ownAfter ).toBe( ownBefore );
			expect( sharedAfter ).toMatch( /__header$/ );
			expect( sharedAfter ).not.toBe( sharedBefore );
			expect( after.css ).toContain( `.${ sharedAfter }` );
			expect( after.css ).toContain(
				'var(--wpds-dimension-gap-md, 12px)'
			);
		} );
	} );
} );
