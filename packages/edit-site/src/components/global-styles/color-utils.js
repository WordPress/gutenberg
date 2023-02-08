/**
 * Internal dependencies
 */

import { useSupportedStyles } from './hooks';

export function useHasColorPanel( name ) {
	const supports = useSupportedStyles( name );
	return (
		supports.includes( 'color' ) ||
		supports.includes( 'backgroundColor' ) ||
		supports.includes( 'background' ) ||
		supports.includes( 'linkColor' )
	);
}
