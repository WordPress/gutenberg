const consent =
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

function loadThemeProvider( themeModule: object, privateApis = {} ) {
	const unlock = jest.fn( () => privateApis );
	jest.doMock( '@wordpress/theme', () => themeModule );
	jest.doMock( '@wordpress/private-apis', () => ( {
		__dangerousOptInToUnstableAPIsOnlyForCoreModules: jest.fn(
			( optInConsent, moduleName ) => {
				expect( optInConsent ).toBe( consent );
				expect( moduleName ).toBe( '@wordpress/ui' );

				return { unlock };
			}
		),
	} ) );

	let ThemeProvider: unknown;
	jest.isolateModules( () => {
		( { ThemeProvider } = require( '../theme-provider' ) );
	} );

	return { ThemeProvider, unlock };
}

describe( 'ThemeProvider compatibility', () => {
	afterEach( () => {
		jest.resetModules();
		jest.dontMock( '@wordpress/theme' );
		jest.dontMock( '@wordpress/private-apis' );
	} );

	it( 'uses the public ThemeProvider when it is available', () => {
		const PublicThemeProvider = jest.fn();
		const PrivateThemeProvider = jest.fn();
		const themePrivateApis = {};

		const { ThemeProvider, unlock } = loadThemeProvider( {
			ThemeProvider: PublicThemeProvider,
			privateApis: themePrivateApis,
		} );

		expect( ThemeProvider ).toBe( PublicThemeProvider );
		expect( unlock ).not.toHaveBeenCalled();
		expect( PrivateThemeProvider ).not.toHaveBeenCalled();
	} );

	it( 'falls back to privateApis.ThemeProvider for older @wordpress/theme runtimes', () => {
		const PrivateThemeProvider = jest.fn();
		const themePrivateApis = {};

		const { ThemeProvider, unlock } = loadThemeProvider(
			{
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
