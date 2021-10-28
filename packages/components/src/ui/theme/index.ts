/**
 * External dependencies
 */
import {
	useTheme as useEmotionTheme,
	Theme as EmotionTheme,
} from '@emotion/react';
import type { DeepPartial } from 'utility-types';
import { merge } from 'lodash';

/**
 * Internal dependencies
 */
import { CONFIG, COLORS } from '../../utils';

type Config = typeof CONFIG;
type Colors = typeof COLORS;
export type Theme = {
	config: Config;
	colors: Colors;
};
type WordPressTheme = Theme;

const DEFAULT_THEME: Theme = { config: CONFIG, colors: COLORS };

/**
 * Creates a theme getter function using lodash's `merge` to allow for easy
 * partial overrides.
 *
 * @param  overrides Override values for the particular theme being created
 * @param  isStatic  Whether to inherit from ancestor themes
 * @return A theme getter function to be passed to emotion's ThemeProvider
 */
export const createTheme = (
	overrides: DeepPartial< Theme >,
	isStatic: boolean = false
) =>
	isStatic === true
		? ( merge( {}, DEFAULT_THEME, overrides ) as Theme )
		: ( ancestor: EmotionTheme ) =>
				merge( {}, DEFAULT_THEME, ancestor, overrides ) as Theme;

const isWordPressTheme = ( theme: any ): theme is WordPressTheme =>
	'config' in theme && 'colors' in theme;

export const safeTheme = ( theme: EmotionTheme ): Theme =>
	isWordPressTheme( theme ) ? theme : DEFAULT_THEME;

export const useTheme = () => safeTheme( useEmotionTheme() );
