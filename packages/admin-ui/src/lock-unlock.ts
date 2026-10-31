// eslint-disable-next-line no-restricted-imports -- Exists solely for the Storybook router decorator in stories/with-router.tsx, which isn't shipped. Remove once #77040 decouples Page from @wordpress/route.
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
		'@wordpress/admin-ui'
	);
