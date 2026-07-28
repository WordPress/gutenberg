/**
 * Internal dependencies
 */
import {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
} from './utils/viewport';
import {
	getDuotoneFilter,
	getDuotoneStylesheet,
	getDuotoneUnsetStylesheet,
} from './utils/duotone';
import { resolveStyle } from './resolve-style';
import { getVariationStyle } from './variation';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
	getDuotoneFilter,
	getDuotoneStylesheet,
	getDuotoneUnsetStylesheet,
	resolveStyle,
	getVariationStyle,
} );
