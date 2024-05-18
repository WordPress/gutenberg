/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo, useState } from '@wordpress/element';
import { __experimentalGrid as Grid } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PreviewStyles from './preview-styles';
import Variation from './variations/variation';
import { isVariationWithSingleProperty } from '../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';
import { unlock } from '../../lock-unlock';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

export default function StyleVariationsContainer( { gap = 2 } ) {
	const { user } = useContext( GlobalStylesContext );
	const [ currentUserStyles ] = useState( { ...user } );
	const userStyles = currentUserStyles?.styles;
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

	multiplePropertyVariations.unshift( {
		title: __( 'Default' ),
		settings: {},
		styles: {},
	} );

	const withEmptyVariation = useMemo( () => {
		return [
			...( multiplePropertyVariations ?? [] ).map( ( variation ) => {
				const blockStyles = { ...variation?.styles?.blocks } || {};
				// We need to copy any user custom CSS to the variation to prevent it being lost
				// when switching variations.
				if ( userStyles?.blocks ) {
					Object.keys( userStyles.blocks ).forEach( ( blockName ) => {
						// First get any block specific custom CSS from the current user styles and merge with any custom CSS for
						// that block in the variation.
						if ( userStyles.blocks[ blockName ].css ) {
							const variationBlockStyles =
								blockStyles[ blockName ] || {};

							blockStyles[ blockName ] = {
								...variationBlockStyles,
								css: `${
									blockStyles[ blockName ]?.css || ''
								} ${ userStyles.blocks[ blockName ].css }`,
							};
						}
					} );
				}
				// Now merge any global custom CSS from current user styles with global custom CSS in the variation.
				const globalCustomCSS =
					userStyles?.css || variation.styles?.css
						? `${ variation.styles?.css || '' } ${
								userStyles?.css || ''
						  }`
						: '';

				const styles = {
					...variation.styles,
					css: globalCustomCSS,
					blocks: {
						...blockStyles,
					},
				};
				return {
					...variation,
					settings: variation.settings ?? {},
					styles: styles ?? {},
				};
			} ),
		];
	}, [ multiplePropertyVariations, userStyles.blocks, userStyles?.css ] );

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
