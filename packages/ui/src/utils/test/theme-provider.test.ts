import { afterEach, describe, expect, it, vi } from 'vitest';

const consent =
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

async function loadThemeProvider(
	themeModule: Partial< typeof import('@wordpress/theme') >,
	privateApis: object = {}
) {
	const unlockSpy = vi.fn();
	const unlock = < T = unknown >( object: unknown ): T => {
		unlockSpy( object );
		return privateApis as T;
	};
	vi.doMock(
		import( '@wordpress/theme' ),
		() => themeModule as typeof import('@wordpress/theme')
	);
	vi.doMock(
		import( '@wordpress/private-apis' ),
		async ( importOriginal ) => ( {
			...( await importOriginal() ),
			__dangerousOptInToUnstableAPIsOnlyForCoreModules: vi.fn(
				( optInConsent, moduleName ) => {
					expect( optInConsent ).toBe( consent );
					expect( moduleName ).toBe( '@wordpress/ui' );

					return { lock: vi.fn(), unlock };
				}
			),
		} )
	);

	const { ThemeProvider } = await import( '../theme-provider' );

	return { ThemeProvider, unlock: unlockSpy };
}

describe( 'ThemeProvider compatibility', () => {
	afterEach( () => {
		vi.resetModules();
		vi.doUnmock( import( '@wordpress/theme' ) );
		vi.doUnmock( import( '@wordpress/private-apis' ) );
	} );

	it( 'uses the public ThemeProvider when it is available', async () => {
		const PublicThemeProvider = vi.fn();
		const PrivateThemeProvider = vi.fn();
		const themePrivateApis = {};

		const { ThemeProvider, unlock } = await loadThemeProvider( {
			ThemeProvider: PublicThemeProvider,
			privateApis: themePrivateApis,
		} );

		expect( ThemeProvider ).toBe( PublicThemeProvider );
		expect( unlock ).not.toHaveBeenCalled();
		expect( PrivateThemeProvider ).not.toHaveBeenCalled();
	} );

	it( 'falls back to privateApis.ThemeProvider for older @wordpress/theme runtimes', async () => {
		const PrivateThemeProvider = vi.fn();
		const themePrivateApis = {};

		const { ThemeProvider, unlock } = await loadThemeProvider(
			{
				ThemeProvider: undefined,
				privateApis: themePrivateApis,
			},
			{
				ThemeProvider: PrivateThemeProvider,
			}
		);

		expect( ThemeProvider ).toBe( PrivateThemeProvider );
		expect( unlock ).toHaveBeenCalledWith( themePrivateApis );
	} );
} );
