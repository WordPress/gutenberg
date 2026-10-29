import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it( 'loads the plugins with require() from CommonJS', () => {
	// Run in a separate Node process, so the plugins are loaded by Node's own
	// `require()`, which rejects ES modules that use top-level `await`.
	const output = execFileSync(
		process.execPath,
		[ join( import.meta.dirname, 'fixtures/require/require-plugins.cjs' ) ],
		{ encoding: 'utf8' }
	);
	const result = JSON.parse( output );

	expect( result.loaded ).toEqual( Array( 7 ).fill( true ) );
	expect( result.css ).toBe(
		'.a { gap: var(--wpds-dimension-gap-sm, 8px); }'
	);
} );
