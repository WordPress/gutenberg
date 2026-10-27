import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it( 'leaves code unchanged and skips token validation without @wordpress/theme', () => {
	// Run in a separate Node process, where a resolution hook hides the optional
	// `@wordpress/theme` peer dependency from the plugins.
	const output = execFileSync(
		process.execPath,
		[ join( __dirname, 'fixtures/without-theme/run-plugins.mjs' ) ],
		{ encoding: 'utf8' }
	);
	const result = JSON.parse( output );

	expect( result.postcss ).toBe( '.a { color: var(--wpds-not-a-token); }' );
	expect( result.lightningcss ).toContain( 'var(--wpds-not-a-token)' );
	expect( result.lightningcss ).not.toContain( 'var(--wpds-not-a-token,' );
	expect( result.js ).toBeNull();
	expect( result.stylelintWarnings ).toEqual( [] );
} );
