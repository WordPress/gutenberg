/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { useContext, useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getValueFromVariable, getPresetVariableFromValue } from './utils';
import { getValueFromObjectPath, setImmutably } from '../../utils/object';
import { GlobalStylesContext } from './context';
import { unlock } from '../../lock-unlock';

const EMPTY_CONFIG = { settings: {}, styles: {} };

const VALID_SETTINGS = [
	'appearanceTools',
	'useRootPaddingAwareAlignments',
	'background.backgroundImage',
	'background.backgroundRepeat',
	'background.backgroundSize',
	'background.backgroundPosition',
	'border.color',
	'border.radius',
	'border.style',
	'border.width',
	'shadow.presets',
	'shadow.defaultPresets',
	'color.background',
	'color.button',
	'color.caption',
	'color.custom',
	'color.customDuotone',
	'color.customGradient',
	'color.defaultDuotone',
	'color.defaultGradients',
	'color.defaultPalette',
	'color.duotone',
	'color.gradients',
	'color.heading',
	'color.link',
	'color.palette',
	'color.text',
	'custom',
	'dimensions.aspectRatio',
	'dimensions.minHeight',
	'layout.contentSize',
	'layout.definitions',
	'layout.wideSize',
	'lightbox.enabled',
	'lightbox.allowEditing',
	'position.fixed',
	'position.sticky',
	'spacing.customSpacingSize',
	'spacing.defaultSpacingSizes',
	'spacing.spacingSizes',
	'spacing.spacingScale',
	'spacing.blockGap',
	'spacing.margin',
	'spacing.padding',
	'spacing.units',
	'typography.fluid',
	'typography.customFontSize',
	'typography.defaultFontSizes',
	'typography.dropCap',
	'typography.fontFamilies',
	'typography.fontSizes',
	'typography.fontStyle',
	'typography.fontWeight',
	'typography.letterSpacing',
	'typography.lineHeight',
	'typography.textAlign',
	'typography.textColumns',
	'typography.textDecoration',
	'typography.textTransform',
	'typography.writingMode',
];

export const useGlobalStylesReset = () => {
	const { user, setUserConfig } = useContext( GlobalStylesContext );
	const config = {
		settings: user.settings,
		styles: user.styles,
	};
	const canReset = !! config && ! fastDeepEqual( config, EMPTY_CONFIG );
	return [
		canReset,
		useCallback( () => setUserConfig( EMPTY_CONFIG ), [ setUserConfig ] ),
	];
};

export function useGlobalSetting( propertyPath, blockName, source = 'all' ) {
	const { setUserConfig, ...configs } = useContext( GlobalStylesContext );
	const appendedBlockPath = blockName ? '.blocks.' + blockName : '';
	const appendedPropertyPath = propertyPath ? '.' + propertyPath : '';
	const contextualPath = `settings${ appendedBlockPath }${ appendedPropertyPath }`;
	const globalPath = `settings${ appendedPropertyPath }`;
	const sourceKey = source === 'all' ? 'merged' : source;

	const settingValue = useMemo( () => {
		const configToUse = configs[ sourceKey ];
		if ( ! configToUse ) {
			throw 'Unsupported source';
		}

		if ( propertyPath ) {
			return (
				getValueFromObjectPath( configToUse, contextualPath ) ??
				getValueFromObjectPath( configToUse, globalPath )
			);
		}

		let result = {};
		VALID_SETTINGS.forEach( ( setting ) => {
			const value =
				getValueFromObjectPath(
					configToUse,
					`settings${ appendedBlockPath }.${ setting }`
				) ??
				getValueFromObjectPath( configToUse, `settings.${ setting }` );
			if ( value !== undefined ) {
				result = setImmutably( result, setting.split( '.' ), value );
			}
		} );
		return result;
	}, [
		configs,
		sourceKey,
		propertyPath,
		contextualPath,
		globalPath,
		appendedBlockPath,
	] );

	const setSetting = ( newValue ) => {
		setUserConfig( ( currentConfig ) =>
			setImmutably( currentConfig, contextualPath.split( '.' ), newValue )
		);
	};
	return [ settingValue, setSetting ];
}

export function useGlobalStyle(
	path,
	blockName,
	source = 'all',
	{ shouldDecodeEncode = true } = {}
) {
	const {
		merged: mergedConfig,
		base: baseConfig,
		user: userConfig,
		setUserConfig,
	} = useContext( GlobalStylesContext );
	const appendedPath = path ? '.' + path : '';
	const finalPath = ! blockName
		? `styles${ appendedPath }`
		: `styles.blocks.${ blockName }${ appendedPath }`;

	const setStyle = ( newValue ) => {
		setUserConfig( ( currentConfig ) =>
			setImmutably(
				currentConfig,
				finalPath.split( '.' ),
				shouldDecodeEncode
					? getPresetVariableFromValue(
							mergedConfig.settings,
							blockName,
							path,
							newValue
					  )
					: newValue
			)
		);
	};

	let rawResult, result;
	switch ( source ) {
		case 'all':
			rawResult = getValueFromObjectPath( mergedConfig, finalPath );
			result = shouldDecodeEncode
				? getValueFromVariable( mergedConfig, blockName, rawResult )
				: rawResult;
			break;
		case 'user':
			rawResult = getValueFromObjectPath( userConfig, finalPath );
			result = shouldDecodeEncode
				? getValueFromVariable( mergedConfig, blockName, rawResult )
				: rawResult;
			break;
		case 'base':
			rawResult = getValueFromObjectPath( baseConfig, finalPath );
			result = shouldDecodeEncode
				? getValueFromVariable( baseConfig, blockName, rawResult )
				: rawResult;
			break;
		default:
			throw 'Unsupported source';
	}

	return [ result, setStyle ];
}

/**
 * React hook that overrides a global settings object with block and element specific settings.
 *
 * @param {Object}     parentSettings Settings object.
 * @param {blockName?} blockName      Block name.
 * @param {element?}   element        Element name.
 *
 * @return {Object} Merge of settings and supports.
 */
export function useSettingsForBlockElement(
	parentSettings,
	blockName,
	element
) {
	const { supportedStyles, supports } = useSelect(
		( select ) => {
			return {
				supportedStyles: unlock(
					select( blocksStore )
				).getSupportedStyles( blockName, element ),
				supports:
					select( blocksStore ).getBlockType( blockName )?.supports,
			};
		},
		[ blockName, element ]
	);

	return useMemo( () => {
		const updatedSettings = { ...parentSettings };

		if ( ! supportedStyles.includes( 'fontSize' ) ) {
			updatedSettings.typography = {
				...updatedSettings.typography,
				fontSizes: {},
				customFontSize: false,
				defaultFontSizes: false,
			};
		}

		if ( ! supportedStyles.includes( 'fontFamily' ) ) {
			updatedSettings.typography = {
				...updatedSettings.typography,
				fontFamilies: {},
			};
		}

		updatedSettings.color = {
			...updatedSettings.color,
			text:
				updatedSettings.color?.text &&
				supportedStyles.includes( 'color' ),
			background:
				updatedSettings.color?.background &&
				( supportedStyles.includes( 'background' ) ||
					supportedStyles.includes( 'backgroundColor' ) ),
			button:
				updatedSettings.color?.button &&
				supportedStyles.includes( 'buttonColor' ),
			heading:
				updatedSettings.color?.heading &&
				supportedStyles.includes( 'headingColor' ),
			link:
				updatedSettings.color?.link &&
				supportedStyles.includes( 'linkColor' ),
			caption:
				updatedSettings.color?.caption &&
				supportedStyles.includes( 'captionColor' ),
		};

		// Some blocks can enable background colors but disable gradients.
		if ( ! supportedStyles.includes( 'background' ) ) {
			updatedSettings.color.gradients = [];
			updatedSettings.color.customGradient = false;
		}

		// If filters are not supported by the block/element, disable duotone.
		if ( ! supportedStyles.includes( 'filter' ) ) {
			updatedSettings.color.defaultDuotone = false;
			updatedSettings.color.customDuotone = false;
		}

		[
			'lineHeight',
			'fontStyle',
			'fontWeight',
			'letterSpacing',
			'textAlign',
			'textTransform',
			'textDecoration',
			'writingMode',
		].forEach( ( key ) => {
			if ( ! supportedStyles.includes( key ) ) {
				updatedSettings.typography = {
					...updatedSettings.typography,
					[ key ]: false,
				};
			}
		} );

		// The column-count style is named text column to reduce confusion with
		// the columns block and manage expectations from the support.
		// See: https://github.com/WordPress/gutenberg/pull/33587
		if ( ! supportedStyles.includes( 'columnCount' ) ) {
			updatedSettings.typography = {
				...updatedSettings.typography,
				textColumns: false,
			};
		}

		[ 'contentSize', 'wideSize' ].forEach( ( key ) => {
			if ( ! supportedStyles.includes( key ) ) {
				updatedSettings.layout = {
					...updatedSettings.layout,
					[ key ]: false,
				};
			}
		} );

		[ 'padding', 'margin', 'blockGap' ].forEach( ( key ) => {
			if ( ! supportedStyles.includes( key ) ) {
				updatedSettings.spacing = {
					...updatedSettings.spacing,
					[ key ]: false,
				};
			}

			const sides = Array.isArray( supports?.spacing?.[ key ] )
				? supports?.spacing?.[ key ]
				: supports?.spacing?.[ key ]?.sides;
			// Check if spacing type is supported before adding sides.
			if ( sides?.length && updatedSettings.spacing?.[ key ] ) {
				updatedSettings.spacing = {
					...updatedSettings.spacing,
					[ key ]: {
						...updatedSettings.spacing?.[ key ],
						sides,
					},
				};
			}
		} );

		[ 'aspectRatio', 'minHeight' ].forEach( ( key ) => {
			if ( ! supportedStyles.includes( key ) ) {
				updatedSettings.dimensions = {
					...updatedSettings.dimensions,
					[ key ]: false,
				};
			}
		} );

		[ 'radius', 'color', 'style', 'width' ].forEach( ( key ) => {
			if (
				! supportedStyles.includes(
					'border' + key.charAt( 0 ).toUpperCase() + key.slice( 1 )
				)
			) {
				updatedSettings.border = {
					...updatedSettings.border,
					[ key ]: false,
				};
			}
		} );

		[ 'backgroundImage', 'backgroundSize' ].forEach( ( key ) => {
			if ( ! supportedStyles.includes( key ) ) {
				updatedSettings.background = {
					...updatedSettings.background,
					[ key ]: false,
				};
			}
		} );

		updatedSettings.shadow = supportedStyles.includes( 'shadow' )
			? updatedSettings.shadow
			: false;

		// Text alignment is only available for blocks.
		if ( element ) {
			updatedSettings.typography.textAlign = false;
		}

		return updatedSettings;
	}, [ parentSettings, supportedStyles, supports, element ] );
}

export function useColorsPerOrigin( settings ) {
	const customColors = settings?.color?.palette?.custom;
	const themeColors = settings?.color?.palette?.theme;
	const defaultColors = settings?.color?.palette?.default;
	const shouldDisplayDefaultColors = settings?.color?.defaultPalette;

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
	}, [
		customColors,
		themeColors,
		defaultColors,
		shouldDisplayDefaultColors,
	] );
}

export function useGradientsPerOrigin( settings ) {
	const customGradients = settings?.color?.gradients?.custom;
	const themeGradients = settings?.color?.gradients?.theme;
	const defaultGradients = settings?.color?.gradients?.default;
	const shouldDisplayDefaultGradients = settings?.color?.defaultGradients;

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
	}, [
		customGradients,
		themeGradients,
		defaultGradients,
		shouldDisplayDefaultGradients,
	] );
}
