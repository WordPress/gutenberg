// High-level Settings API
export { getSetting } from './settings/get-setting';
export { setSetting } from './settings/set-setting';
export { getStyle } from './settings/get-style';
export { setStyle } from './settings/set-style';
export { default as getPalettes } from './settings/get-palette';

// Utilities
export { areGlobalStylesEqual } from './core/equal';
export { mergeGlobalStyles } from './core/merge';
export { default as getGlobalStylesChanges } from './utils/get-global-styles-changes';

// Core rendering
export { generateGlobalStyles } from './core/render';
export {
	transformToStyles as toStyles,
	getBlockSelectors,
	getLayoutStyles,
} from './core/render';
export { getBlockSelector } from './core/selectors';

// Utilities (Ideally these shouldn't be exposed)
export { getTypographyFontSizeValue } from './utils/typography';
export {
	getValueFromVariable,
	getPresetVariableFromValue,
	getResolvedValue,
} from './utils/common';

// Types
export type * from './types';
