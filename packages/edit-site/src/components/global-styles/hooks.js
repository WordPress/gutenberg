/**
 * External dependencies
 */
import { get, cloneDeep, set, isEqual, has } from 'lodash';

/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { useContext, useCallback, useMemo } from '@wordpress/element';
import {
	getBlockType,
	__EXPERIMENTAL_PATHS_WITH_MERGE as PATHS_WITH_MERGE,
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getValueFromVariable, getPresetVariableFromValue } from './utils';
import { GlobalStylesContext } from './context';

const EMPTY_CONFIG = { isGlobalStylesUserThemeJSON: true, version: 1 };

export const useGlobalStylesReset = () => {
	const { user: config, setUserConfig } = useContext( GlobalStylesContext );
	const canReset = !! config && ! isEqual( config, EMPTY_CONFIG );
	return [
		canReset,
		useCallback( () => setUserConfig( () => EMPTY_CONFIG ), [
			setUserConfig,
		] ),
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
			const newUserConfig = cloneDeep( currentConfig );
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
			const newUserConfig = cloneDeep( currentConfig );
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
				mergedConfig.settings,
				blockName,
				get( userConfig, finalPath ) ?? get( baseConfig, finalPath )
			);
			break;
		case 'user':
			result = getValueFromVariable(
				mergedConfig.settings,
				blockName,
				get( userConfig, finalPath )
			);
			break;
		case 'base':
			result = getValueFromVariable(
				baseConfig.settings,
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
	'fontFamily',
	'fontSize',
	'fontStyle',
	'fontWeight',
	'lineHeight',
	'textDecoration',
	'textTransform',
	'padding',
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
	Object.keys( STYLE_PROPERTY ).forEach( ( styleName ) => {
		if ( ! STYLE_PROPERTY[ styleName ].support ) {
			return;
		}

		// Opting out means that, for certain support keys like background color,
		// blocks have to explicitly set the support value false. If the key is
		// unset, we still enable it.
		if ( STYLE_PROPERTY[ styleName ].requiresOptOut ) {
			if (
				has(
					blockType.supports,
					STYLE_PROPERTY[ styleName ].support[ 0 ]
				) &&
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
