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
import { filterObjectByProperty } from './utils';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

function getFontFamilyFromSetting( themeJson, setting ) {
	const fontFamilyVariable = setting.replace( 'var(', '' ).replace( ')', '' );
	const fontFamilySlug = fontFamilyVariable?.split( '--' ).slice( -1 )[ 0 ];

	const fontFamilies = themeJson?.settings?.typography?.fontFamilies?.theme; // TODO this could not be under theme.

	return fontFamilies.find(
		( fontFamily ) => fontFamily.slug === fontFamilySlug
	);
}

function getValuesFromObject( object, property, result = [] ) {
	for ( const key in object ) {
		if ( typeof object[ key ] === 'object' ) {
			getValuesFromObject( object[ key ], property, result );
		} else {
			result.push( object[ key ] );
		}
	}
	return result;
}

export default function Typeset() {
	const { base, user } = useContext( GlobalStylesContext );

	const themeJson = mergeBaseAndUserConfigs( base, user );

	const fontFamilySettings = filterObjectByProperty(
		themeJson.styles, // Don't need the stuff in settings.
		'fontFamily'
	);

	const fontFamilyValuesFromThemeJson = getValuesFromObject(
		fontFamilySettings,
		'fontFamily'
	);

	const uniqueFontFamilies = Array.from(
		new Set( fontFamilyValuesFromThemeJson ) // To remove duplicates.
	).filter( ( value ) => value !== 'inherit' ); // To remove inherit.

	const fontFamilies = uniqueFontFamilies.map( ( fontFamily ) =>
		getFontFamilyFromSetting( themeJson, fontFamily )
	);

	const fontsCount = fontFamilies.length;
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
							{ fontFamilies.map( ( fontFamily ) => {
								const style =
									getFamilyPreviewStyle( fontFamily );
								return (
									<FlexItem
										key={ fontFamily.slug }
										style={ style }
									>
										{ fontFamily.name }
									</FlexItem>
								);
							} ) }
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
