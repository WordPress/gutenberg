/**
 * External dependencies
 */
import colorize from 'tinycolor2';

/**
 * Internal dependencies
 */
import { get } from '../../create-styles';
import { space } from '../mixins/space';
import { config } from './config';
import { generateColorAdminColors } from './utils';
import { getComputedColor } from '../../utils/colors';

const baseTheme = Object.freeze( Object.assign( {}, config ) );

/* eslint-disable jsdoc/valid-types */
/**
 * @param {(props: { get: typeof get, theme: typeof baseTheme, color: typeof colorize, space: typeof space }) => Record<string, string>} callback
 * @return {Record<string, string>} The theme.
 */
export function createTheme( callback ) {
	/* eslint-enable jsdoc/valid-types */
	const props = {
		get,
		theme: baseTheme,
		color: colorize,
		space,
	};

	const customConfig = callback( props );

	let colorAdminColors = {};

	if ( customConfig.colorAdmin ) {
		const colorAdminValue = getComputedColor( customConfig.colorAdmin );
		colorAdminColors = generateColorAdminColors( colorAdminValue );
	}

	return {
		...customConfig,
		...colorAdminColors,
	};
}
