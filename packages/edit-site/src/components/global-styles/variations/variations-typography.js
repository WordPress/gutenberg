/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from '../global-styles-provider';
import { unlock } from '../../../lock-unlock';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';
import PreviewTypography from '../preview-typography';
import Subtitle from '../subtitle';
import { getFontFamilies } from '../utils';
import Variation from './variation';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

export default function TypographyVariations() {
	const typographyVariations =
		useCurrentMergeThemeStyleVariationsWithUserConfig( {
			property: 'typography',
			filter: ( variation ) =>
				variation?.settings?.typography?.fontFamilies &&
				Object.keys( variation?.settings?.typography?.fontFamilies )
					.length,
		} );

	const { base } = useContext( GlobalStylesContext );

	/*
	 * Filter duplicate variations based on the font families used in the variation.
	 */
	const uniqueTypographyVariations = typographyVariations?.length
		? Object.values(
				typographyVariations.reduce( ( acc, variation ) => {
					const [ bodyFontFamily, headingFontFamily ] =
						getFontFamilies(
							mergeBaseAndUserConfigs( base, variation )
						);
					if (
						headingFontFamily?.name &&
						bodyFontFamily?.name &&
						! acc[
							`${ headingFontFamily?.name }:${ bodyFontFamily?.name }`
						]
					) {
						acc[
							`${ headingFontFamily?.name }:${ bodyFontFamily?.name }`
						] = variation;
					}

					return acc;
				}, {} )
		  )
		: [];

	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Presets' ) }</Subtitle>
			<Grid
				columns={ 3 }
				className="edit-site-global-styles-style-variations-container"
			>
				{ typographyVariations && typographyVariations.length
					? uniqueTypographyVariations.map( ( variation, index ) => (
							<Variation key={ index } variation={ variation }>
								{ () => (
									<PreviewTypography
										variation={ variation }
									/>
								) }
							</Variation>
					  ) )
					: null }
			</Grid>
		</VStack>
	);
}
