/**
 * WordPress dependencies
 */
import { useContext, useEffect, useMemo, useState } from '@wordpress/element';
import { __experimentalGrid as Grid } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PreviewStyles from './preview-styles';
import Variation from './variations/variation';
import { useThemeStyles } from '../../hooks/';
import { unlock } from '../../lock-unlock';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

export default function StyleVariationsContainer( { gap = 2 } ) {
	const { user } = useContext( GlobalStylesContext );
	const [ currentUserStyles, setCurrentUserStyles ] = useState( user );
	const userStyles = currentUserStyles?.styles;

	useEffect( () => {
		setCurrentUserStyles( user );
	}, [ user ] );

	const themeStyles = useThemeStyles();
	const themeVariations = useMemo( () => {
		const withEmptyVariation = [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...( themeStyles ?? [] ),
		];

		return [
			...withEmptyVariation.map( ( variation ) => {
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
							const customCSS = {
								css: `${
									blockStyles[ blockName ]?.css || ''
								} ${
									userStyles.blocks[ blockName ].css.trim() ||
									''
								}`,
							};
							blockStyles[ blockName ] = {
								...variationBlockStyles,
								...customCSS,
							};
						}
					} );
				}
				// Now merge any global custom CSS from current user styles with global custom CSS in the variation.
				const css =
					userStyles?.css || variation.styles?.css
						? {
								css: `${ variation.styles?.css || '' } ${
									userStyles?.css || ''
								}`,
						  }
						: {};

				const blocks =
					Object.keys( blockStyles ).length > 0
						? { blocks: blockStyles }
						: {};

				const styles = {
					...variation.styles,
					...css,
					...blocks,
				};
				return {
					...variation,
					settings: variation.settings ?? {},
					styles,
				};
			} ),
		];
	}, [ themeStyles, userStyles?.blocks, userStyles?.css ] );

	if ( themeVariations.length <= 1 ) {
		return null;
	}

	return (
		<Grid
			columns={ 2 }
			className="edit-site-global-styles-style-variations-container"
			gap={ gap }
		>
			{ themeVariations.map( ( variation, index ) => (
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
