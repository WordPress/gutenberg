import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { __experimentalGrid as Grid } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type {
	GlobalStylesConfig,
	StyleVariation,
} from '@wordpress/global-styles-engine';
import PreviewStyles from './preview-styles';
import Variation from './variations/variation';
import { GlobalStylesContext } from './context';
import { getPreservedUserCss } from './get-preserved-user-css';
import { isVariationWithProperties } from './utils';

interface StyleVariationsContainerProps {
	gap?: number;
}

function StyleVariationsContainer( {
	gap = 2,
}: StyleVariationsContainerProps ) {
	const { user } = useContext( GlobalStylesContext );
	const userStyles = user?.styles;

	const variations = useSelect( ( select ) => {
		const result =
			select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations();
		// The API might return null or an array
		return Array.isArray( result )
			? ( result as GlobalStylesConfig[] )
			: undefined;
	}, [] );

	// Filter out variations that are color or typography variations.
	const fullStyleVariations = variations?.filter(
		( variation: GlobalStylesConfig ) => {
			return (
				! isVariationWithProperties( variation, [ 'color' ] ) &&
				! isVariationWithProperties( variation, [
					'typography',
					'spacing',
				] )
			);
		}
	);

	const themeVariations = useMemo( () => {
		const themeVariationList = fullStyleVariations ?? [];
		const themeCssSources = themeVariationList.map(
			( themeVariation ) => themeVariation.styles?.css
		);
		// Only Additional CSS authored by the user should travel between
		// variations — not CSS that came from a previously selected variation.
		const preservedUserCss = getPreservedUserCss(
			userStyles?.css,
			themeCssSources
		);

		const withEmptyVariation: StyleVariation[] = [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...themeVariationList,
		];
		return [
			...withEmptyVariation.map( ( variation: StyleVariation ) => {
				const blockStyles = variation?.styles?.blocks
					? { ...variation.styles.blocks }
					: {};

				// We need to copy any user custom CSS to the variation to prevent it being lost
				// when switching variations.
				if ( userStyles?.blocks ) {
					Object.keys( userStyles.blocks ).forEach( ( blockName ) => {
						// First get any block specific custom CSS from the current user styles and merge with any custom CSS for
						// that block in the variation.
						if ( userStyles.blocks?.[ blockName ]?.css ) {
							const preservedBlockCss = getPreservedUserCss(
								userStyles.blocks[ blockName ].css,
								themeVariationList.map(
									( themeVariation ) =>
										themeVariation.styles?.blocks?.[
											blockName
										]?.css
								)
							);
							if ( ! preservedBlockCss ) {
								return;
							}
							const variationBlockStyles =
								blockStyles[ blockName ] || {};
							const customCSS = {
								css: `${
									blockStyles[ blockName ]?.css || ''
								} ${ preservedBlockCss }`.trim(),
							};
							blockStyles[ blockName ] = {
								...variationBlockStyles,
								...customCSS,
							};
						}
					} );
				}
				// Now merge any global custom CSS from current user styles with global custom CSS in the variation.
				const mergedCss =
					`${ variation.styles?.css || '' } ${ preservedUserCss }`.trim();
				const css = mergedCss ? { css: mergedCss } : {};

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
	}, [ fullStyleVariations, userStyles?.blocks, userStyles?.css ] );

	if ( ! fullStyleVariations || fullStyleVariations.length < 1 ) {
		return null;
	}

	return (
		<Grid
			columns={ 2 }
			className="global-styles-ui-style-variations-container"
			gap={ gap }
		>
			{ themeVariations.map(
				( variation: StyleVariation, index: number ) => (
					<Variation key={ index } variation={ variation }>
						{ ( isFocused: boolean ) => (
							<PreviewStyles
								label={ variation?.title }
								withHoverView
								isFocused={ isFocused }
								variation={ variation }
							/>
						) }
					</Variation>
				)
			) }
		</Grid>
	);
}

export default StyleVariationsContainer;
