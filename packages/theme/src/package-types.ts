import type { ReactElement } from 'react';
import type { ThemeProviderProps } from './types.js';

/**
 * @deprecated Private `@wordpress/theme` APIs will be removed in WordPress 7.3.
 * Use public `@wordpress/theme` APIs for supported theming use cases.
 */
export declare const privateApis: {};

/**
 * Context provider that generates a theme from a set of seed color values and
 * configuration, producing a set of design token overrides as CSS custom
 * properties.
 */
export declare const ThemeProvider: (
	props: ThemeProviderProps
) => ReactElement;

export type * from './prebuilt/ts/token-types.js';
