import {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
	getViewportPreviewSizes,
} from './utils/viewport';
import {
	getDuotoneFilter,
	getDuotoneStylesheet,
	getDuotoneUnsetStylesheet,
} from './utils/duotone';
import { transformToStylesWithTextClipBase } from './core/render';
import { resolveStyle } from './resolve-style';
import { getVariationStyle } from './variation';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
	getViewportPreviewSizes,
	getDuotoneFilter,
	getDuotoneStylesheet,
	getDuotoneUnsetStylesheet,
	resolveStyle,
	getVariationStyle,
	transformToStylesWithTextClipBase,
} );
