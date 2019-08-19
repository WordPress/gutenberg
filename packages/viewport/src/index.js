/**
 * Internal dependencies
 */
import './store';
import addDimensionsEventListener from './listener';

import { BREAKPOINTS, OPERATORS } from './with-viewport-match';

export { default as ifViewportMatches } from './if-viewport-matches';
export { default as withViewportMatch, ViewportMatchWidthProvider } from './with-viewport-match';

addDimensionsEventListener( BREAKPOINTS, OPERATORS );
