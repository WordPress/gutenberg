/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo, useContext, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import {
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import { unlock } from '../../lock-unlock';
import { getFamilyPreviewStyle } from './font-library-modal/utils/preview-styles';
import useThemeStyleVariationsByProperty from './use-theme-style-variations-by-property';
import Subtitle from './subtitle';

const { GlobalStylesContext, areGlobalStyleConfigsEqual } = unlock(
	blockEditorPrivateApis
);

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

function TypographyVariation( { variation } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { base, user, setUserConfig } = useContext( GlobalStylesContext );
	const context = useMemo( () => {
		return {
			user: {
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			},
			base,
			merged: mergeBaseAndUserConfigs( base, variation ),
			setUserConfig: () => {},
		};
	}, [ variation, base ] );

	const selectVariation = () => {
		setUserConfig( () => {
			return {
				settings: variation.settings,
				styles: variation.styles,
			};
		} );
	};

	const selectOnEnter = ( event ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			selectVariation();
		}
	};

	const isActive = useMemo( () => {
		return areGlobalStyleConfigsEqual( user, variation );
	}, [ user, variation ] );

	let label = variation?.title;
	if ( variation?.description ) {
		label = sprintf(
			/* translators: %1$s: variation title. %2$s variation description. */
			__( '%1$s (%2$s)' ),
			variation?.title,
			variation?.description
		);
	}

	const [ bodyFontFamilies, headingFontFamilies ] = getFontFamilies(
		mergeBaseAndUserConfigs( base, variation )
	);
	const bodyPreviewStyle = bodyFontFamilies
		? getFamilyPreviewStyle( bodyFontFamilies )
		: {};
	const headingPreviewStyle = {
		...( headingFontFamilies &&
			getFamilyPreviewStyle( headingFontFamilies ) ),
		fontSize: '1.2rem',
	};

	return (
		<GlobalStylesContext.Provider value={ context }>
			<div
				className={ classnames(
					'edit-site-global-styles-variations_item',
					{
						'is-active': isActive,
					}
				) }
				role="button"
				onClick={ selectVariation }
				onKeyDown={ selectOnEnter }
				tabIndex="0"
				aria-label={ label }
				aria-current={ isActive }
				onFocus={ () => setIsFocused( true ) }
				onBlur={ () => setIsFocused( false ) }
			>
				<VStack
					className="edit-site-global-styles-variations_item-preview"
					isFocused={ isFocused }
					style={ {
						height: 70,
						lineHeight: 1.2,
						textAlign: 'center',
					} }
				>
					<div style={ headingPreviewStyle }>
						{ headingFontFamilies?.name || variation?.title }
					</div>
					<div style={ bodyPreviewStyle }>
						{ bodyFontFamilies?.name || __( 'Typeset' ) }
					</div>
				</VStack>
			</div>
		</GlobalStylesContext.Provider>
	);
}

export default function TypographyVariations() {
	const typographyVariations = useThemeStyleVariationsByProperty( {
		styleProperty: 'typography',
	} );
	const { base } = useContext( GlobalStylesContext );
	const uniqueTypographyVariations = [];
	const uniqueTypographyNames = [];
	const isDup = ( x, y ) => {
		return uniqueTypographyNames.find( ( it ) => {
			return JSON.stringify( it ) === JSON.stringify( [ x, y ] );
		} );
	};

	typographyVariations?.forEach( ( variation ) => {
		const [ bodyFontFamilyName, headingFontFamilyName ] =
			getFontFamilyNames( mergeBaseAndUserConfigs( base, variation ) );
		if ( ! isDup( bodyFontFamilyName, headingFontFamilyName ) ) {
			uniqueTypographyVariations.push( variation );
			uniqueTypographyNames.push( [
				bodyFontFamilyName,
				headingFontFamilyName,
			] );
		}
	} );

	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Presets' ) }</Subtitle>
			<Grid
				columns={ 2 }
				className="edit-site-global-styles-style-variations-container"
			>
				{ typographyVariations && typographyVariations.length
					? uniqueTypographyVariations.map( ( variation, index ) => {
							return (
								<TypographyVariation
									key={ index }
									variation={ variation }
								/>
							);
					  } )
					: null }
			</Grid>
		</VStack>
	);
}
