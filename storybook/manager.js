/**
 * External dependencies
 */
import { addons } from '@storybook/addons';

/**
 * Internal dependencies
 */
import theme from './theme';
import sidebar from './sidebar';

addons.setConfig( {
	sidebar,
	theme,
} );
