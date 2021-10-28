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
import { CONFIG, COLORS } from '../..';

type Config = typeof CONFIG;
type Colors = typeof COLORS;
export type WordPressTheme = {
	config: Config;
	colors: Colors;
};

const DEFAULT_THEME: WordPressTheme = { config: CONFIG, colors: COLORS };

/**
 * Creates a theme getter function using lodash's `merge` to allow for easy
 * partial overrides.
 *
 * @param  overrides        Override values for the particular theme being created
 * @param  options          Options configuration for the `createTheme` function
 * @param  options.isStatic Whether to inherit from ancestor themes
 * @return A theme getter function to be passed to emotion's ThemeProvider
 */
export const createTheme = (
	overrides: DeepPartial< WordPressTheme >,
	{ isStatic }: { isStatic: boolean } = { isStatic: true }
) =>
	isStatic
		? ( merge( {}, DEFAULT_THEME, overrides ) as WordPressTheme )
		: ( ancestor: EmotionTheme ) =>
				merge(
					{},
					DEFAULT_THEME,
					ancestor,
					overrides
				) as WordPressTheme;

const isWordPressTheme = ( theme: any ): theme is WordPressTheme =>
	'config' in theme && 'colors' in theme;

export const safeTheme = ( theme: EmotionTheme ): WordPressTheme =>
	isWordPressTheme( theme ) ? theme : DEFAULT_THEME;

export const useTheme = () => safeTheme( useEmotionTheme() );
