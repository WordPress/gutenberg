/**
 * External dependencies
 */
import { addons } from 'storybook/manager-api';
import { defaultConfig } from 'storybook-addon-tag-badges';

/**
 * Internal dependencies
 */
import { tagBadges } from './badges';
import sidebar from './sidebar';
import theme from './theme';

addons.setConfig( {
	sidebar,
	tagBadges: [ ...tagBadges, ...defaultConfig ],
	theme,
} );
