import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test } from 'vitest';

const currentDirectory = dirname( fileURLToPath( import.meta.url ) );
const checkerPath = join(
	currentDirectory,
	'check-block-library-frontend-styles.ts'
);
const temporaryRoots: string[] = [];

afterEach( () => {
	for ( const root of temporaryRoots.splice( 0 ) ) {
		rmSync( root, { force: true, recursive: true } );
	}
} );

function check( files: Record< string, string > ) {
	const root = mkdtempSync(
		join( tmpdir(), 'check-block-library-frontend-styles-' )
	);
	temporaryRoots.push( root );

	for ( const [ path, contents ] of Object.entries( {
		'style.css': '',
		...files,
	} ) ) {
		const filePath = join( root, path );
		mkdirSync( dirname( filePath ), { recursive: true } );
		writeFileSync( filePath, contents );
	}

	return spawnSync( process.execPath, [ checkerPath, root ], {
		encoding: 'utf8',
	} );
}

test( 'passes when only editor stylesheets, comments, strings, or definitions mention admin tokens', () => {
	const result = check( {
		'common.css': [
			'/* Uses var(--wpds-color-stroke-focus). */',
			':root { --wp-admin-theme-color: #3858e9; }',
			'.a { top: var(--wp-admin--admin-bar--height, 0px); }',
			'.a::before { content: "var(--wpds-color-stroke-focus)"; }',
		].join( '\n' ),
		'editor.css': '.a { color: var(--wpds-color-stroke-focus); }',
		'reset.css': '.a { color: var(--wp-admin-theme-color); }',
		'paragraph/editor.css':
			'.a { color: var(--wp-components-color-accent); }',
	} );

	expect( result.stderr ).toBe( '' );
	expect( result.status ).toBe( 0 );
} );

test( 'reports admin tokens referenced in frontend stylesheets', () => {
	const result = check( {
		'paragraph/style.css': [
			'.a {',
			'  font-size: var(--wpds-typography-font-size-md, 13px);',
			'}',
		].join( '\n' ),
		'quote/theme.css':
			'.a { color: var(--x, var(--wp-components-color-accent)); }',
		'theme.css': '.a { color: var( --wp-admin-theme-color-darker-10 ); }',
		'cover/style-rtl.css': [
			'.a {',
			'  box-sizing: border-box; outline-width: var(--wp-admin-border-width-focus);',
			'}',
		].join( '\n' ),
		'quote/style.css': [
			'.a::before { content: "/*"; }',
			'.a { color: var(--wp-components-color-foreground); }',
			'.a::after { content: "*/"; }',
		].join( '\n' ),
	} );

	expect( result.status ).toBe( 1 );
	expect( result.stderr ).toContain(
		// eslint-disable-next-line @wordpress/no-unknown-ds-tokens -- The expectation quotes the token name as data.
		'paragraph/style.css:2: --wpds-typography-font-size-md'
	);
	expect( result.stderr ).toContain(
		'quote/theme.css:1: --wp-components-color-accent'
	);
	expect( result.stderr ).toContain(
		'theme.css:1: --wp-admin-theme-color-darker-10'
	);
	expect( result.stderr ).toContain(
		'cover/style-rtl.css:2: --wp-admin-border-width-focus'
	);
	expect( result.stderr ).toContain(
		'quote/style.css:2: --wp-components-color-foreground'
	);
	expect( result.stderr ).toContain(
		'Found 5 admin design token references'
	);
} );

test( 'fails when the styles have not been built', () => {
	const root = mkdtempSync(
		join( tmpdir(), 'check-block-library-frontend-styles-' )
	);
	temporaryRoots.push( root );

	const result = spawnSync( process.execPath, [ checkerPath, root ], {
		encoding: 'utf8',
	} );

	expect( result.status ).toBe( 2 );
	expect( result.stderr ).toContain( 'Run `npm run build` first.' );
} );
