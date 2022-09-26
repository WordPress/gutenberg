/**
 * Internal dependencies
 */

import { getSupportedGlobalStylesPanels } from './hooks';

export function useHasColorPanel( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		supports.includes( 'color' ) ||
		supports.includes( 'backgroundColor' ) ||
		supports.includes( 'background' ) ||
		supports.includes( 'linkColor' )
	);
}
