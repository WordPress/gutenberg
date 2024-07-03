/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import './push-changes-to-global-styles';
import { isVariationWithProperties } from './use-theme-style-variations/use-theme-style-variations-by-property';

export function useThemeStyles() {
	const variations = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeGlobalStylesVariations();
	}, [] );

	// Filter out variations that are of single property type, i.e. color or typography variations.
	return variations?.filter( ( variation ) => {
		return (
			! isVariationWithProperties( variation, [ 'color' ] ) &&
			! isVariationWithProperties( variation, [ 'typography' ] )
		);
	} );
}
