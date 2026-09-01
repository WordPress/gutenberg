// eslint-disable-next-line no-restricted-imports -- Exists solely for the ThemeProvider compatibility fallback in utils/theme-provider.ts. Remove in WordPress 7.3.
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/ui'
	);
