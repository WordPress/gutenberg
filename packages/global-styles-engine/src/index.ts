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
	processCSSNesting,
} from './core/render';
export { getBlockSelector } from './core/selectors';

// Utilities (Ideally these shouldn't be exposed)
export { getTypographyFontSizeValue } from './utils/typography';
export { getDimensionPresetCssVar } from './utils/dimensions';
export { getViewportMediaQueries } from './utils/viewport';
export {
	getValueFromVariable,
	getPresetVariableFromValue,
	getResolvedValue,
	splitSelectorList,
} from './utils/common';
export {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
} from './utils/viewport';
export {
	getDuotoneFilter,
	getDuotoneStylesheet,
	getDuotoneUnsetStylesheet,
} from './utils/duotone';
export { resolveStyle } from './resolve-style';
export { getVariationStyle } from './variation';

// Types
export type * from './types';
export type {
	ResolvedStyle,
	SourceDescriptor,
	ResolveStyleContext,
} from './resolve-style';

export { generatePreviewStateStyles as __unstableGeneratePreviewStateStyles } from './preview-state-styles';
