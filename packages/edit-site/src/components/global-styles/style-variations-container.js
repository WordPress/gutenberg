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

export default function StyleVariationsContainer( { gap = 2 } ) {
	const variations = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeGlobalStylesVariations();
	}, [] );

	const withEmptyVariation = useMemo( () => {
		return [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...( variations ?? [] ).map( ( variation ) => ( {
				...variation,
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			} ) ),
		];
	}, [ variations ] );

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
