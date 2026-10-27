import { afterEach, describe, expect, test, vi } from 'vitest';
import { inertValue } from '..';

/**
 * Re-imports the helper with React reporting the given version. The helper
 * reads the version once when the module loads, so the module registry has to
 * be reset for the mock to take effect.
 *
 * @param version Version for React to report.
 * @return The helper bound to that React version.
 */
async function inertValueForReact( version: string ) {
	vi.resetModules();
	vi.doMock( 'react', async ( importOriginal ) => ( {
		...( await importOriginal< typeof import( 'react' ) >() ),
		version,
	} ) );
	return ( await import( '..' ) ).inertValue;
}

describe( 'inertValue', () => {
	afterEach( () => {
		vi.doUnmock( 'react' );
		vi.resetModules();
	} );

	test( 'returns a string under React 18, which drops a boolean `inert`', async () => {
		const forReact18 = await inertValueForReact( '18.3.1' );

		expect( forReact18( true ) ).toBe( 'true' );
	} );

	test( 'returns a boolean under React 19, which renders `inert` natively', async () => {
		const forReact19 = await inertValueForReact( '19.3.0' );

		expect( forReact19( true ) ).toBe( true );
	} );

	test( 'omits the attribute when the element is not inert', async () => {
		const forReact18 = await inertValueForReact( '18.3.1' );
		const forReact19 = await inertValueForReact( '19.3.0' );

		expect( forReact18( false ) ).toBeUndefined();
		expect( forReact18( undefined ) ).toBeUndefined();
		expect( forReact19( undefined ) ).toBeUndefined();
		expect( forReact19( false ) ).toBe( false );
	} );

	test( 'marks the element inert under the React the caller is running', () => {
		expect( inertValue( true ) ).toBeTruthy();
		expect( inertValue( false ) ).toBeFalsy();
	} );
} );
