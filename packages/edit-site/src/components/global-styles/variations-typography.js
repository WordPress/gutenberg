/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
	__unstableMotion as motion,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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
const getFontFamilyNames = ( themeJson ) => {
	const [ bodyFontFamily, headingFontFamily ] = getFontFamilies( themeJson );
	return [ bodyFontFamily?.name, headingFontFamily?.name ];
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
			<span style={ headingPreviewStyle }>A</span>
			<span style={ bodyPreviewStyle }>a</span>
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
	const uniqueTypographyVariations = [];
	const uniqueTypographyNames = [];
	const isDup = ( x, y ) => {
		return uniqueTypographyNames.find( ( it ) => {
			return JSON.stringify( it ) === JSON.stringify( [ x, y ] );
		} );
	};

	/*
		@TODO: not convinced about this yet. Originally, it skipped variations that didn't have
		any heading/body fonts, and therefore names.
		If we want to pull all "variations", then probably the first iteration is to name the variations according to their titles.
	 */
	typographyVariations?.forEach( ( variation ) => {
		const [ bodyFontFamilyName, headingFontFamilyName ] =
			getFontFamilyNames( mergeBaseAndUserConfigs( base, variation ) );
		if ( ! isDup( bodyFontFamilyName, headingFontFamilyName ) ) {
			uniqueTypographyVariations.push( variation );
			if ( bodyFontFamilyName && headingFontFamilyName ) {
				uniqueTypographyNames.push( [
					bodyFontFamilyName,
					headingFontFamilyName,
				] );
			}
		}
	} );

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
