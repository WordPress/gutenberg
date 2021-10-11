/**
 * External dependencies
 */
import { get, cloneDeep, set, isEqual, has, mergeWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	getBlockType,
	__EXPERIMENTAL_PATHS_WITH_MERGE as PATHS_WITH_MERGE,
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import {
	PRESET_METADATA,
	getValueFromVariable,
	getPresetVariableFromValue,
} from './utils';

const EMPTY_CONFIG = { isGlobalStylesUserThemeJSON: true, version: 1 };

function mergeTreesCustomizer( objValue, srcValue ) {
	// We only pass as arrays the presets,
	// in which case we want the new array of values
	// to override the old array (no merging).
	if ( Array.isArray( srcValue ) ) {
		return srcValue;
	}
}

function mergeBaseAndUserConfigs( base, user ) {
	return mergeWith( {}, base, user, mergeTreesCustomizer );
}

function addUserOriginToSettings( settingsToAdd ) {
	const newSettings = cloneDeep( settingsToAdd );
	PRESET_METADATA.forEach( ( { path } ) => {
		const presetData = get( newSettings, path );
		if ( presetData ) {
			set( newSettings, path, {
				user: presetData,
			} );
		}
	} );
	return newSettings;
}

function removeUserOriginFromSettings( settingsToRemove ) {
	const newSettings = cloneDeep( settingsToRemove );
	PRESET_METADATA.forEach( ( { path } ) => {
		const presetData = get( newSettings, path );
		if ( presetData ) {
			set( newSettings, path, ( presetData ?? {} ).user );
		}
	} );
	return newSettings;
}

function useGlobalStylesUserConfig() {
	const { globalStylesId, content } = useSelect( ( select ) => {
		const _globalStylesId = select( editSiteStore ).getSettings()
			.__experimentalGlobalStylesUserEntityId;
		return {
			globalStylesId: _globalStylesId,
			content: select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_global_styles',
				_globalStylesId
			)?.content,
		};
	}, [] );
	const { getEditedEntityRecord } = useSelect( coreStore );
	const { editEntityRecord } = useDispatch( coreStore );

	const parseContent = ( contentToParse ) => {
		let parsedConfig;
		try {
			parsedConfig = contentToParse ? JSON.parse( contentToParse ) : {};
			// It is very important to verify if the flag isGlobalStylesUserThemeJSON is true.
			// If it is not true the content was not escaped and is not safe.
			if ( ! parsedConfig.isGlobalStylesUserThemeJSON ) {
				parsedConfig = {};
			} else {
				parsedConfig = {
					...parsedConfig,
					settings: addUserOriginToSettings( parsedConfig.settings ),
				};
			}
		} catch ( e ) {
			/* eslint-disable no-console */
			console.error( 'Global Styles User data is not valid' );
			console.error( e );
			/* eslint-enable no-console */
			parsedConfig = {};
		}

		return parsedConfig;
	};

	const config = useMemo( () => {
		return parseContent( content );
	}, [ content ] );

	const setConfig = useCallback(
		( callback ) => {
			const currentConfig = parseContent(
				getEditedEntityRecord(
					'postType',
					'wp_global_styles',
					globalStylesId
				)?.content
			);
			const updatedConfig = callback( currentConfig );
			editEntityRecord( 'postType', 'wp_global_styles', globalStylesId, {
				content: JSON.stringify( {
					...updatedConfig,
					settings: removeUserOriginFromSettings(
						updatedConfig.settings
					),
				} ),
			} );
		},
		[ globalStylesId ]
	);

	return [ config, setConfig ];
}

function useGlobalStylesBaseConfig() {
	const baseConfig = useSelect( ( select ) => {
		return select( editSiteStore ).getSettings()
			.__experimentalGlobalStylesBaseStyles;
	}, [] );

	return baseConfig;
}

export function useGlobalStylesConfig() {
	const [ userConfig, setUserConfig ] = useGlobalStylesUserConfig();
	const baseConfig = useGlobalStylesBaseConfig();
	const mergedConfig = useMemo( () => {
		return mergeBaseAndUserConfigs( baseConfig, userConfig );
	}, [ userConfig, baseConfig ] );

	return [ baseConfig, userConfig, mergedConfig, setUserConfig ];
}

export const useGlobalStylesReset = () => {
	const [ config, setConfig ] = useGlobalStylesUserConfig();
	const canReset = !! config && ! isEqual( config, EMPTY_CONFIG );
	return [
		canReset,
		useCallback( () => setConfig( () => EMPTY_CONFIG ), [ setConfig ] ),
	];
};

export function useSetting( path, blockName, source = 'all' ) {
	const [
		baseConfig,
		userConfig,
		mergedConfig,
		setUserConfig,
	] = useGlobalStylesConfig();

	const fullPath = ! blockName
		? `settings.${ path }`
		: `settings.blocks.${ blockName }.${ path }`;

	const setSetting = ( newValue ) => {
		setUserConfig( ( currentConfig ) => {
			const newUserConfig = cloneDeep( currentConfig );
			const pathToSet = PATHS_WITH_MERGE[ path ]
				? fullPath + '.user'
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
				return result?.user ?? result?.theme ?? result?.core;
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
	const [
		baseConfig,
		userConfig,
		mergedConfig,
		setUserConfig,
	] = useGlobalStylesConfig();
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
