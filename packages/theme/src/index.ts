import type { CornerRadiusPreset as InternalCornerRadiusPreset } from './types';

export { privateApis } from './private-apis';
export { ThemeProvider } from './theme-provider';
export type * from './prebuilt/ts/token-types';

/**
 * @deprecated This type is not part of the intended public API and will be
 * removed in WordPress 7.3. Derive this type from `ThemeProvider`'s
 * `cornerRadius` prop instead.
 */
export type CornerRadiusPreset = InternalCornerRadiusPreset;
