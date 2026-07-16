/**
 * Internal dependencies
 */
import {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
} from './utils/viewport';
import { resolveStyle } from './resolve-style';
import { getVariationStylesWithRefValues } from './variation';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
	resolveStyle,
	getVariationStylesWithRefValues,
} );
