/**
 * External dependencies
 */
import { addons } from '@storybook/manager-api';

/**
 * Internal dependencies
 */
import theme from './theme';
import sidebar from './sidebar';

addons.setConfig( {
	sidebar,
	theme,
} );
