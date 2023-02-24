/**
 * Internal dependencies
 */
import { useSupportedStyles } from './hooks';

export function useHasFilterPanel( name ) {
	const supports = useSupportedStyles( name );
	return supports.includes( 'filter' );
}
