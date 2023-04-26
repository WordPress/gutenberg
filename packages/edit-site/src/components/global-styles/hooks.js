/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { useContext, useCallback, useMemo } from '@wordpress/element';
import {
	getBlockType,
	__EXPERIMENTAL_PATHS_WITH_MERGE as PATHS_WITH_MERGE,
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
} from '@wordpress/blocks';
import { store as blocksStore } from '@wordpress/blocks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { useSelect } from '@wordpress/data';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

// Enable colord's a11y plugin.
extend( [ a11yPlugin ] );

const EMPTY_CONFIG = { settings: {}, styles: {} };

export const useGlobalStylesReset = () => {
	const { user: config, setUserConfig } = useContext( GlobalStylesContext );
	const canReset = !! config && ! fastDeepEqual( config, EMPTY_CONFIG );
	return [
		canReset,
		useCallback(
			() => setUserConfig( () => EMPTY_CONFIG ),
			[ setUserConfig ]
		),
	];
};

export function useSetting( path, blockName, source = 'all' ) {
	const {
		merged: mergedConfig,
		base: baseConfig,
		user: userConfig,
		setUserConfig,
	} = useContext( GlobalStylesContext );

	const fullPath = ! blockName
		? `settings.${ path }`
		: `settings.blocks.${ blockName }.${ path }`;

	const setSetting = ( newValue ) => {
		setUserConfig( ( currentConfig ) => {
			// Deep clone `currentConfig` to avoid mutating it later.
			const newUserConfig = JSON.parse( JSON.stringify( currentConfig ) );
			const pathToSet = PATHS_WITH_MERGE[ path ]
				? fullPath + '.custom'
				: fullPath;
			set( newUserConfig, pathToSet, newValue );

			return newUserConfig;
		} );
	};

	const getSettingValueForContext = ( name ) => {
		const currentPath = ! name
			? `settings.${ path }`
			: `settings.blocks.${ name }.${ path }`;

		const getSettingValue = ( configToUse ) => {
			const result = get( configToUse, currentPath );
			if ( PATHS_WITH_MERGE[ path ] ) {
				return result?.custom ?? result?.theme ?? result?.default;
			}
			return result;
		};

		let result;
		switch ( source ) {
			case 'all':
				result = getSettingValue( mergedConfig );
				break;
			case 'user':
				result = getSettingValue( userConfig );
				break;
			case 'base':
				result = getSettingValue( baseConfig );
				break;
			default:
				throw 'Unsupported source';
		}

		return result;
	};

	// Unlike styles settings get inherited from top level settings.
	const resultWithFallback =
		getSettingValueForContext( blockName ) ?? getSettingValueForContext();

	return [ resultWithFallback, setSetting ];
}

export function useStyle( path, blockName, source = 'all' ) {
	const {
		merged: mergedConfig,
		base: baseConfig,
		user: userConfig,
		setUserConfig,
	} = useContext( GlobalStylesContext );
	const finalPath = ! blockName
		? `styles.${ path }`
		: `styles.blocks.${ blockName }.${ path }`;

	const setStyle = ( newValue ) => {
		setUserConfig( ( currentConfig ) => {
			// Deep clone `currentConfig` to avoid mutating it later.
			const newUserConfig = JSON.parse( JSON.stringify( currentConfig ) );
			set(
				newUserConfig,
				finalPath,
				getPresetVariableFromValue(
					mergedConfig.settings,
					blockName,
					path,
					newValue
				)
			);
			return newUserConfig;
		} );
	};

	let result;
	switch ( source ) {
		case 'all':
			result = getValueFromVariable(
				mergedConfig,
				blockName,
				// The stlyes.css path is allowed to be empty, so don't revert to base if undefined.
				finalPath === 'styles.css'
					? get( userConfig, finalPath )
					: get( userConfig, finalPath ) ??
							get( baseConfig, finalPath )
			);
			break;
		case 'user':
			result = getValueFromVariable(
				mergedConfig,
				blockName,
				get( userConfig, finalPath )
			);
			break;
		case 'base':
			result = getValueFromVariable(
				baseConfig,
				blockName,
				get( baseConfig, finalPath )
			);
			break;
		default:
			throw 'Unsupported source';
	}

	return [ result, setStyle ];
}

const ROOT_BLOCK_SUPPORTS = [
	'background',
	'backgroundColor',
	'color',
	'linkColor',
	'buttonColor',
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'textDecoration',
	'padding',
	'contentSize',
	'wideSize',
	'blockGap',
];

export function getSupportedGlobalStylesPanels( name ) {
	if ( ! name ) {
		return ROOT_BLOCK_SUPPORTS;
	}

	const blockType = getBlockType( name );

	if ( ! blockType ) {
		return [];
	}

	const supportKeys = [];

	// Check for blockGap support.
	// Block spacing support doesn't map directly to a single style property, so needs to be handled separately.
	// Also, only allow `blockGap` support if serialization has not been skipped, to be sure global spacing can be applied.
	if (
		blockType?.supports?.spacing?.blockGap &&
		blockType?.supports?.spacing?.__experimentalSkipSerialization !==
			true &&
		! blockType?.supports?.spacing?.__experimentalSkipSerialization?.some?.(
			( spacingType ) => spacingType === 'blockGap'
		)
	) {
		supportKeys.push( 'blockGap' );
	}

	Object.keys( STYLE_PROPERTY ).forEach( ( styleName ) => {
		if ( ! STYLE_PROPERTY[ styleName ].support ) {
			return;
		}

		// Opting out means that, for certain support keys like background color,
		// blocks have to explicitly set the support value false. If the key is
		// unset, we still enable it.
		if ( STYLE_PROPERTY[ styleName ].requiresOptOut ) {
			if (
				STYLE_PROPERTY[ styleName ].support[ 0 ] in
					blockType.supports &&
				get(
					blockType.supports,
					STYLE_PROPERTY[ styleName ].support
				) !== false
			) {
				return supportKeys.push( styleName );
			}
		}

		if (
			get(
				blockType.supports,
				STYLE_PROPERTY[ styleName ].support,
				false
			)
		) {
			return supportKeys.push( styleName );
		}
	} );

	return supportKeys;
}

export function useColorsPerOrigin( name ) {
	const [ customColors ] = useSetting( 'color.palette.custom', name );
	const [ themeColors ] = useSetting( 'color.palette.theme', name );
	const [ defaultColors ] = useSetting( 'color.palette.default', name );
	const [ shouldDisplayDefaultColors ] = useSetting( 'color.defaultPalette' );

	return useMemo( () => {
		const result = [];
		if ( themeColors && themeColors.length ) {
			result.push( {
				name: _x(
					'Theme',
					'Indicates this palette comes from the theme.'
				),
				colors: themeColors,
			} );
		}
		if (
			shouldDisplayDefaultColors &&
			defaultColors &&
			defaultColors.length
		) {
			result.push( {
				name: _x(
					'Default',
					'Indicates this palette comes from WordPress.'
				),
				colors: defaultColors,
			} );
		}
		if ( customColors && customColors.length ) {
			result.push( {
				name: _x(
					'Custom',
					'Indicates this palette is created by the user.'
				),
				colors: customColors,
			} );
		}
		return result;
	}, [ customColors, themeColors, defaultColors ] );
}

export function useGradientsPerOrigin( name ) {
	const [ customGradients ] = useSetting( 'color.gradients.custom', name );
	const [ themeGradients ] = useSetting( 'color.gradients.theme', name );
	const [ defaultGradients ] = useSetting( 'color.gradients.default', name );
	const [ shouldDisplayDefaultGradients ] = useSetting(
		'color.defaultGradients'
	);

	return useMemo( () => {
		const result = [];
		if ( themeGradients && themeGradients.length ) {
			result.push( {
				name: _x(
					'Theme',
					'Indicates this palette comes from the theme.'
				),
				gradients: themeGradients,
			} );
		}
		if (
			shouldDisplayDefaultGradients &&
			defaultGradients &&
			defaultGradients.length
		) {
			result.push( {
				name: _x(
					'Default',
					'Indicates this palette comes from WordPress.'
				),
				gradients: defaultGradients,
			} );
		}
		if ( customGradients && customGradients.length ) {
			result.push( {
				name: _x(
					'Custom',
					'Indicates this palette is created by the user.'
				),
				gradients: customGradients,
			} );
		}
		return result;
	}, [ customGradients, themeGradients, defaultGradients ] );
}

export function useFontFamilies() {
	const [ fonts = [], setFontFamilies ] = useSetting(
		'typography.fontFamilies'
	);

	const getFontSlug = ( content = '' ) => {
		// Get the slug.
		return (
			content
				// Convert anything that's not a letter or number to a hyphen.
				.replace( /[^\p{L}\p{N}]+/gu, '-' )
				// Convert to lowercase
				.toLowerCase()
				// Remove any remaining leading or trailing hyphens.
				.replace( /(^-+)|(-+$)/g, '' )
		);
	};

	// sort font families alphabetically
	const fontFamilies = useMemo( () => {
		return fonts.sort( ( a, b ) =>
			getFontSlug( a.name || a.fontFamily ).localeCompare(
				getFontSlug( b.name || b.fontFamily )
			)
		);
	}, [ fonts ] );

	const count = fontFamilies.length || 0;

	const sortFontFaces = ( fontFaces ) => {
		return fontFaces.sort( ( a, b ) => {
			if ( a.fontStyle === b.fontStyle ) {
				return a.fontWeight.localeCompare( b.fontWeight );
			}
			return a.fontStyle.localeCompare( b.fontStyle ) * -1;
		} );
	};

	const handleAddFontFace = ( fontFace ) => {
		const { fontFamily, fontWeight, fontStyle } = fontFace;
		const slug = getFontSlug( fontFamily );
		const existingFamilyIndex = fontFamilies.findIndex(
			( { slug: s } ) => s === slug
		);

		const existingFace =
			existingFamilyIndex !== -1
				? fontFamilies[ existingFamilyIndex ]?.fontFace?.find(
						( { fontWeight: weight, fontStyle: style } ) =>
							weight === fontWeight && style === fontStyle
				  )
				: null;

		const isReAddingFontFace = existingFace && existingFace.shouldBeRemoved;

		if ( existingFace && ! isReAddingFontFace ) {
			throw new Error( __( 'Font face already exists.' ) );
		}

		fontFace.shouldBeDecoded = true;

		if ( existingFamilyIndex !== -1 ) {
			// deep	copy
			const updatedFontFamilies = JSON.parse(
				JSON.stringify( fontFamilies )
			);

			if (
				Array.isArray( fontFamilies[ existingFamilyIndex ].fontFace )
			) {
				if ( ! isReAddingFontFace ) {
					updatedFontFamilies[ existingFamilyIndex ].fontFace = [
						...updatedFontFamilies[ existingFamilyIndex ].fontFace,
						fontFace,
					];
				} else {
					delete fontFace.shouldBeRemoved;
					updatedFontFamilies[ existingFamilyIndex ].fontFace = [
						...updatedFontFamilies[
							existingFamilyIndex
						].fontFace.filter(
							( { fontWeight: weight, fontStyle: style } ) =>
								weight !== fontWeight || style !== fontStyle
						),
						fontFace,
					];
				}
			} else {
				updatedFontFamilies[ existingFamilyIndex ].fontFace = [
					fontFace,
				];
			}
			setFontFamilies( updatedFontFamilies );
		} else {
			const newFamily = {
				fontFamily,
				name: fontFamily,
				slug,
				fontFace: [ fontFace ],
			};
			setFontFamilies( [ ...fontFamilies, newFamily ] );
		}
	};

	const handleRemoveFontFace = ( fontFamily, fontWeight, fontStyle ) => {
		const slug = getFontSlug( fontFamily );
		const existingFamilyIndex = fontFamilies.findIndex(
			( { slug: s } ) => s === slug
		);

		// add shouldBeRemoved flag to fontFace for the backend to remove it
		const updatedFontFaces = fontFamilies[
			existingFamilyIndex
		].fontFace.map( ( fontFace ) => {
			if (
				fontFace.fontWeight === fontWeight &&
				fontFace.fontStyle === fontStyle
			) {
				return {
					...fontFace,
					shouldBeRemoved: true,
				};
			}
			return fontFace;
		} );

		const updatedFamily = {
			...fontFamilies[ existingFamilyIndex ],
			fontFace: updatedFontFaces,
		};

		// Add shouldBeRemoved flag to the family if all fontFaces are removed
		if (
			updatedFontFaces.every( ( fontFace ) => fontFace.shouldBeRemoved )
		) {
			updatedFamily.shouldBeRemoved = true;
		}

		const updatedFontFamilies = JSON.parse(
			JSON.stringify( fontFamilies )
		);
		updatedFontFamilies[ existingFamilyIndex ] = updatedFamily;
		setFontFamilies( updatedFontFamilies );
	};

	return {
		fontFamilies,
		count,
		handleAddFontFace,
		handleRemoveFontFace,
		getFontSlug,
		sortFontFaces,
	};
}

export function useColorRandomizer( name ) {
	const [ themeColors, setThemeColors ] = useGlobalSetting(
		'color.palette.theme',
		name
	);

	function randomizeColors() {
		/* eslint-disable no-restricted-syntax */
		const randomRotationValue = Math.floor( Math.random() * 225 );
		/* eslint-enable no-restricted-syntax */

		const newColors = themeColors.map( ( colorObject ) => {
			const { color } = colorObject;
			const newColor = colord( color )
				.rotate( randomRotationValue )
				.toHex();

			return {
				...colorObject,
				color: newColor,
			};
		} );

		setThemeColors( newColors );
	}

	return window.__experimentalEnableColorRandomizer
		? [ randomizeColors ]
		: [];
}

export function useSupportedStyles( name, element ) {
	const { supportedPanels } = useSelect(
		( select ) => {
			return {
				supportedPanels: unlock(
					select( blocksStore )
				).getSupportedStyles( name, element ),
			};
		},
		[ name, element ]
	);

	return supportedPanels;
}
