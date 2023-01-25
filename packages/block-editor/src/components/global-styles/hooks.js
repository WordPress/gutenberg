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
import { unlock } from '../../experiments';

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
	const {
		merged: mergedConfig,
		base: baseConfig,
		user: userConfig,
		setUserConfig,
	} = useContext( GlobalStylesContext );

	const pathParts = [ 'settings' ];
	if ( blockName ) {
		pathParts.push( `blocks.${ blockName }` );
	}
	if ( propertyPath ) {
		pathParts.push( propertyPath );
	}
	const fullPath = pathParts.join( '.' );

	const setSetting = ( newValue ) => {
		setUserConfig( ( currentConfig ) => {
			// Deep clone `currentConfig` to avoid mutating it later.
			const newUserConfig = JSON.parse( JSON.stringify( currentConfig ) );
			set( newUserConfig, fullPath, newValue );

			return newUserConfig;
		} );
	};

	const getSettingValueForContext = ( currentBlockName, settingPath ) => {
		const currentPathParts = [ 'settings' ];
		if ( currentBlockName ) {
			currentPathParts.push( `blocks.${ currentBlockName }` );
		}
		currentPathParts.push( settingPath );
		const currentPath = currentPathParts.join( '.' );

		let result;
		switch ( source ) {
			case 'all':
				result = get( mergedConfig, currentPath );
				break;
			case 'user':
				result = get( userConfig, currentPath );
				break;
			case 'base':
				result = get( baseConfig, currentPath );
				break;
			default:
				throw 'Unsupported source';
		}

		return result;
	};

	// Unlike styles settings get inherited from top level settings.
	const resultWithFallback = useMemo( () => {
		if ( propertyPath ) {
			return (
				getSettingValueForContext( blockName, propertyPath ) ??
				getSettingValueForContext( undefined, propertyPath )
			);
		}
		const result = {};
		VALID_SETTINGS.forEach( ( setting ) => {
			set(
				result,
				setting,
				getSettingValueForContext( blockName, setting ) ??
					getSettingValueForContext( undefined, setting )
			);
		} );
		return result;
	}, [
		mergedConfig,
		userConfig,
		baseConfig,
		blockName,
		propertyPath,
		source,
	] );

	return [ resultWithFallback, setSetting ];
}

export function useGlobalStyle(
	path,
	blockName,
	source = 'all',
	shouldDecodeEncode = true
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
					: get( userConfig, finalPath ) ??
					  get( baseConfig, finalPath );
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
