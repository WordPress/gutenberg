/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';
import { get, set } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext, useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getValueFromVariable, getPresetVariableFromValue } from './utils';
import { GlobalStylesContext } from './context';
import { unlock } from '../../lock-unlock';

const EMPTY_CONFIG = { settings: {}, styles: {} };

const VALID_SETTINGS = [
	'appearanceTools',
	'useRootPaddingAwareAlignments',
	'border.color',
	'border.radius',
	'border.style',
	'border.width',
	'shadow.presets',
	'shadow.defaultPresets',
	'color.background',
	'color.custom',
	'color.customDuotone',
	'color.customGradient',
	'color.defaultDuotone',
	'color.defaultGradients',
	'color.defaultPalette',
	'color.duotone',
	'color.gradients',
	'color.link',
	'color.palette',
	'color.text',
	'custom',
	'dimensions.minHeight',
	'layout.contentSize',
	'layout.definitions',
	'layout.wideSize',
	'position.fixed',
	'position.sticky',
	'spacing.customSpacingSize',
	'spacing.spacingSizes',
	'spacing.spacingScale',
	'spacing.blockGap',
	'spacing.margin',
	'spacing.padding',
	'spacing.units',
	'typography.fuild',
	'typography.customFontSize',
	'typography.dropCap',
	'typography.fontFamilies',
	'typography.fontSizes',
	'typography.fontStyle',
	'typography.fontWeight',
	'typography.letterSpacing',
	'typography.lineHeight',
	'typography.textDecoration',
	'typography.textTransform',
];

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
				get( configToUse, contextualPath ) ??
				get( configToUse, globalPath )
			);
		}

		const result = {};
		VALID_SETTINGS.forEach( ( setting ) => {
			const value =
				get(
					configToUse,
					`settings${ appendedBlockPath }.${ setting }`
				) ?? get( configToUse, `settings.${ setting }` );
			if ( value ) {
				set( result, setting, value );
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
		setUserConfig( ( currentConfig ) => {
			// Deep clone `currentConfig` to avoid mutating it later.
			const newUserConfig = JSON.parse( JSON.stringify( currentConfig ) );
			set( newUserConfig, contextualPath, newValue );

			return newUserConfig;
		} );
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
		setUserConfig( ( currentConfig ) => {
			// Deep clone `currentConfig` to avoid mutating it later.
			const newUserConfig = JSON.parse( JSON.stringify( currentConfig ) );
			set(
				newUserConfig,
				finalPath,
				shouldDecodeEncode
					? getPresetVariableFromValue(
							mergedConfig.settings,
							blockName,
							path,
							newValue
					  )
					: newValue
			);
			return newUserConfig;
		} );
	};

	let rawResult, result;
	switch ( source ) {
		case 'all':
			rawResult =
				// The stlyes.css path is allowed to be empty, so don't revert to base if undefined.
				finalPath === 'styles.css'
					? get( userConfig, finalPath )
					: get( mergedConfig, finalPath );
			result = shouldDecodeEncode
				? getValueFromVariable( mergedConfig, blockName, rawResult )
				: rawResult;
			break;
		case 'user':
			rawResult = get( userConfig, finalPath );
			result = shouldDecodeEncode
				? getValueFromVariable( mergedConfig, blockName, rawResult )
				: rawResult;
			break;
		case 'base':
			rawResult = get( baseConfig, finalPath );
			result = shouldDecodeEncode
				? getValueFromVariable( baseConfig, blockName, rawResult )
				: rawResult;
			break;
		default:
			throw 'Unsupported source';
	}

	return [ result, setStyle ];
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

/**
 * Given a settings object and a list of supported panels,
 * returns a new settings object with the unsupported panels removed.
 *
 * @param {Object}   settings Settings object.
 * @param {string[]} supports Supported style panels.
 *
 * @return {Object} Merge of settings and supports.
 */
export function overrideSettingsWithSupports( settings, supports ) {
	const updatedSettings = { ...settings };

	if ( ! supports.includes( 'fontSize' ) ) {
		updatedSettings.typography = {
			...updatedSettings.typography,
			fontSizes: {},
			customFontSize: false,
		};
	}

	if ( ! supports.includes( 'fontFamily' ) ) {
		updatedSettings.typography = {
			...updatedSettings.typography,
			fontFamilies: {},
		};
	}

	[
		'lineHeight',
		'fontStyle',
		'fontWeight',
		'letterSpacing',
		'textTransform',
	].forEach( ( key ) => {
		if ( ! supports.includes( key ) ) {
			updatedSettings.typography = {
				...updatedSettings.typography,
				[ key ]: false,
			};
		}
	} );

	return updatedSettings;
}
