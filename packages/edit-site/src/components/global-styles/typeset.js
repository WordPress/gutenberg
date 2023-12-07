/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import { unlock } from '../../lock-unlock';
import { NavigationButtonAsItem } from './navigation-button';
import { getFamilyPreviewStyle } from './font-library-modal/utils/preview-styles';
import Subtitle from './subtitle';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

const getFontFamilies = ( themeJson ) => {
	const headingFontFamilyCSS =
		themeJson?.styles?.elements?.heading?.typography?.fontFamily;
	const headingFontFamilyVariable =
		headingFontFamilyCSS &&
		headingFontFamilyCSS.replace( 'var(', '' ).replace( ')', '' );
	const headingFontFamilySlug = headingFontFamilyVariable
		?.split( '--' )
		.slice( -1 )[ 0 ];

	const bodyFontFamilyVariable = themeJson?.styles?.typography?.fontFamily
		.replace( 'var(', '' )
		.replace( ')', '' );

	const bodyFontFamilySlug = bodyFontFamilyVariable
		?.split( '--' )
		.slice( -1 )[ 0 ];

	const fontFamilies = themeJson?.settings?.typography?.fontFamilies?.theme; // TODO this could not be under theme.

	const bodyFontFamily = fontFamilies.find(
		( fontFamily ) => fontFamily.slug === bodyFontFamilySlug
	);

	let headingFontFamily = fontFamilies.find(
		( fontFamily ) => fontFamily.slug === headingFontFamilySlug
	);

	if ( ! headingFontFamily ) {
		headingFontFamily = bodyFontFamily;
	}

	return [ bodyFontFamily, headingFontFamily ];
};
const getFontFamilyNames = ( themeJson ) => {
	const [ bodyFontFamily, headingFontFamily ] = getFontFamilies( themeJson );
	return [ bodyFontFamily?.name, headingFontFamily?.name ];
};

export default function Typeset() {
	const { base, user } = useContext( GlobalStylesContext );
	const [ bodyFont, headingFont ] = getFontFamilies(
		mergeBaseAndUserConfigs( base, user )
	);
	const [ bodyFontFamily, headingFontFamily ] = getFontFamilyNames(
		mergeBaseAndUserConfigs( base, user )
	);

	const bodyPreviewStyle = getFamilyPreviewStyle( bodyFont );
	const headingPreviewStyle = getFamilyPreviewStyle( headingFont );
	const fontsCount = 2; // TODO
	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Typeset' ) }</Subtitle>
			<ItemGroup className="edit-site-global-styles-screen-typography-typeset__button">
				<NavigationButtonAsItem
					path="/typography/typesets"
					aria-label={ __( 'Typesets' ) }
				>
					<HStack justify="space-between">
						<VStack>
							<FlexItem style={ headingPreviewStyle }>
								{ headingFontFamily }
							</FlexItem>
							<FlexItem style={ bodyPreviewStyle }>
								{ bodyFontFamily }
							</FlexItem>
						</VStack>
						<FlexItem style={ { color: '#9e9e9e' } }>
							{ fontsCount } { _n( 'font', 'fonts', fontsCount ) }
						</FlexItem>
					</HStack>
				</NavigationButtonAsItem>
			</ItemGroup>
		</VStack>
	);
}
