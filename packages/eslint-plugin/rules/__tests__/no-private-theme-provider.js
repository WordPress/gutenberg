import { RuleTester } from 'eslint';
import rule from '../no-private-theme-provider';

const ruleTester = new RuleTester( {
	languageOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-private-theme-provider', rule, {
	valid: [
		"import { ThemeProvider } from '@wordpress/theme';",
		"import { privateApis as themePrivateApis } from '@wordpress/theme'; import { unlock } from '../../lock-unlock'; const { useThemeProviderStyles } = unlock( themePrivateApis );",
		"import { privateApis as componentsPrivateApis } from '@wordpress/components'; import { unlock } from '../../lock-unlock'; const { ThemeProvider } = unlock( componentsPrivateApis );",
		`
			import { privateApis as themePrivateApis } from '@wordpress/theme';
			import { unlock } from '../../lock-unlock';

			function test() {
				function unlock( value ) {
					return value;
				}

				const { ThemeProvider } = unlock( themePrivateApis );

				return ThemeProvider;
			}
		`,
	],

	invalid: [
		{
			code: "import { privateApis as themePrivateApis } from '@wordpress/theme'; import { unlock } from '../../lock-unlock'; const { ThemeProvider } = unlock( themePrivateApis );",
			errors: [
				{
					message:
						'Accessing `ThemeProvider` through `@wordpress/theme` private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead.',
				},
			],
		},
		{
			code: "import { privateApis } from '@wordpress/theme'; import { unlock } from '../../lock-unlock'; const { ThemeProvider: ThemeProviderType } = unlock( privateApis );",
			errors: [
				{
					message:
						'Accessing `ThemeProvider` through `@wordpress/theme` private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead.',
				},
			],
		},
		{
			code: "import { privateApis as themePrivateApis } from '@wordpress/theme'; import { unlock } from '../../lock-unlock'; const ThemeProvider = unlock( themePrivateApis ).ThemeProvider;",
			errors: [
				{
					message:
						'Accessing `ThemeProvider` through `@wordpress/theme` private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead.',
				},
			],
		},
		{
			code: "import { privateApis as themePrivateApis } from '@wordpress/theme'; import { unlock } from '../../lock-unlock'; const ThemeProvider = unlock( themePrivateApis )[ 'ThemeProvider' ];",
			errors: [
				{
					message:
						'Accessing `ThemeProvider` through `@wordpress/theme` private APIs is deprecated. Import `ThemeProvider` from `@wordpress/theme` instead.',
				},
			],
		},
	],
} );
