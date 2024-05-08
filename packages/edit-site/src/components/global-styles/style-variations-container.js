/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __experimentalGrid as Grid } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PreviewStyles from './preview-styles';
import Variation from './variations/variation';
import { isVariationWithSingleProperty } from '../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';

export default function StyleVariationsContainer( { gap = 2 } ) {
	const variations = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeGlobalStylesVariations();
	}, [] );

	// Filter out variations that are of single property type, i.e. color or typography variations.
	const multiplePropertyVariations = variations?.filter( ( variation ) => {
		return (
			! isVariationWithSingleProperty( variation, 'color' ) &&
			! isVariationWithSingleProperty( variation, 'typography' )
		);
	} );

	const withEmptyVariation = useMemo( () => {
		return [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...( multiplePropertyVariations ?? [] ).map( ( variation ) => ( {
				...variation,
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			} ) ),
		];
	}, [ multiplePropertyVariations ] );

	return (
		<Grid
			columns={ 2 }
			className="edit-site-global-styles-style-variations-container"
			gap={ gap }
		>
			{ withEmptyVariation.map( ( variation, index ) => (
				<Variation key={ index } variation={ variation }>
					{ ( isFocused ) => (
						<PreviewStyles
							label={ variation?.title }
							withHoverView
							isFocused={ isFocused }
							variation={ variation }
						/>
					) }
				</Variation>
			) ) }
		</Grid>
	);
}
