/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
	__unstableMotion as motion,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import { unlock } from '../../lock-unlock';
import { getFamilyPreviewStyle } from './font-library-modal/utils/preview-styles';
import { useCurrentMergeThemeStyleVariationsWithUserConfig } from '../../hooks/use-theme-style-variations/use-theme-style-variations-by-property';
import Subtitle from './subtitle';
import Variation from './variation';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

function getFontFamilyFromSetting( fontFamilies, setting ) {
	if ( ! setting ) {
		return null;
	}

	const fontFamilyVariable = setting.replace( 'var(', '' ).replace( ')', '' );
	const fontFamilySlug = fontFamilyVariable?.split( '--' ).slice( -1 )[ 0 ];

	return fontFamilies.find(
		( fontFamily ) => fontFamily.slug === fontFamilySlug
	);
}

const getFontFamilies = ( themeJson ) => {
	const fontFamilies = themeJson?.settings?.typography?.fontFamilies?.theme; // TODO this could not be under theme.
	const bodyFontFamilySetting = themeJson?.styles?.typography?.fontFamily;
	const bodyFontFamily = getFontFamilyFromSetting(
		fontFamilies,
		bodyFontFamilySetting
	);

	const headingFontFamilySetting =
		themeJson?.styles?.elements?.heading?.typography?.fontFamily;

	let headingFontFamily;
	if ( ! headingFontFamilySetting ) {
		headingFontFamily = bodyFontFamily;
	} else {
		headingFontFamily = getFontFamilyFromSetting(
			fontFamilies,
			themeJson?.styles?.elements?.heading?.typography?.fontFamily
		);
	}

	return [ bodyFontFamily, headingFontFamily ];
};

const TypePreview = ( { variation } ) => {
	const { base } = useContext( GlobalStylesContext );
	const [ bodyFontFamilies, headingFontFamilies ] = getFontFamilies(
		mergeBaseAndUserConfigs( base, variation )
	);
	const bodyPreviewStyle = bodyFontFamilies
		? getFamilyPreviewStyle( bodyFontFamilies )
		: {};
	const headingPreviewStyle = headingFontFamilies
		? getFamilyPreviewStyle( headingFontFamilies )
		: {};
	return (
		<motion.div
			className="edit-site-global-styles-type-preview"
			animate={ {
				scale: 1,
				opacity: 1,
			} }
			initial={ {
				scale: 0.1,
				opacity: 0,
			} }
			transition={ {
				delay: 0.3,
				type: 'tween',
			} }
		>
			<span style={ headingPreviewStyle }>
				{ _x( 'A', 'Uppercase letter A' ) }
			</span>
			<span style={ bodyPreviewStyle }>
				{ _x( 'a', 'Lowercase letter A' ) }
			</span>
		</motion.div>
	);
};

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
					? uniqueTypographyVariations.map( ( variation, index ) => {
							return (
								<Variation
									key={ index }
									variation={ variation }
								>
									{ () => (
										<TypePreview variation={ variation } />
									) }
								</Variation>
							);
					  } )
					: null }
			</Grid>
		</VStack>
	);
}
