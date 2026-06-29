import type { CornerRadiusPreset as InternalCornerRadiusPreset } from './types';

export { privateApis } from './private-apis';
export { ThemeProvider } from './theme-provider';
export type * from './prebuilt/ts/token-types';

/**
 * @deprecated This type is not part of the intended public API and is scheduled
 * for deletion as `@wordpress/theme` approaches stabilization.
 */
export type CornerRadiusPreset = InternalCornerRadiusPreset;
