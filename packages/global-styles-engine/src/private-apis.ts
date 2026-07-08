/**
 * Internal dependencies
 */
import {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
} from './utils/viewport';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	getResponsiveMediaQueries,
	getViewportBreakpoints,
	getViewportBreakpointValueInPixels,
} );
