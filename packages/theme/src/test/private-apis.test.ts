import { unlock } from '../lock-unlock';
import { privateApis } from '../private-apis';
import { ThemeProvider } from '../theme-provider';
import { useThemeProviderStyles } from '../use-theme-provider-styles';

// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @wordpress/wp-global-usage */

type ScriptDebugGlobal = typeof globalThis & {
	SCRIPT_DEBUG?: boolean;
};

const scriptDebugGlobal = globalThis as ScriptDebugGlobal;

describe( 'privateApis', () => {
	const originalScriptDebug = scriptDebugGlobal.SCRIPT_DEBUG;

	afterEach( () => {
		scriptDebugGlobal.SCRIPT_DEBUG = originalScriptDebug;
	} );

	it( 'warns once when accessing useThemeProviderStyles through private APIs', () => {
		scriptDebugGlobal.SCRIPT_DEBUG = true;
		const warn = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );

		const unlockedPrivateApis = unlock< {
			useThemeProviderStyles: typeof useThemeProviderStyles;
		} >( privateApis );

		expect( unlockedPrivateApis.useThemeProviderStyles ).toBe(
			useThemeProviderStyles
		);
		expect( unlockedPrivateApis.useThemeProviderStyles ).toBe(
			useThemeProviderStyles
		);

		expect( warn ).toHaveBeenCalledTimes( 1 );
		expect( warn ).toHaveBeenCalledWith(
			'ThemeProvider: Accessing `useThemeProviderStyles` through `@wordpress/theme` private APIs is deprecated. This private export is scheduled for deletion as `@wordpress/theme` approaches stabilization.'
		);

		warn.mockRestore();
	} );

	it( 'warns once when accessing ThemeProvider through private APIs', () => {
		scriptDebugGlobal.SCRIPT_DEBUG = true;
		const warn = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );

		const unlockedPrivateApis = unlock< {
			ThemeProvider: typeof ThemeProvider;
		} >( privateApis );

		expect( unlockedPrivateApis.ThemeProvider ).toBe( ThemeProvider );
		expect( unlockedPrivateApis.ThemeProvider ).toBe( ThemeProvider );

		expect( warn ).toHaveBeenCalledTimes( 1 );
		expect( warn ).toHaveBeenCalledWith(
			'ThemeProvider: Accessing `ThemeProvider` through `@wordpress/theme` private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead; this private export is scheduled for deletion as `@wordpress/theme` approaches stabilization.'
		);

		warn.mockRestore();
	} );
} );
