/**
 * External dependencies
 */
import { get, cloneDeep, set, mergeWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { PRESET_METADATA } from './utils';
import { GlobalStylesContext } from './context';

function mergeTreesCustomizer( _, srcValue ) {
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
			.__experimentalGlobalStylesBaseConfig;
	}, [] );

	return baseConfig;
}

function useGlobalStylesContext() {
	const [ userConfig, setUserConfig ] = useGlobalStylesUserConfig();
	const baseConfig = useGlobalStylesBaseConfig();
	const mergedConfig = useMemo( () => {
		return mergeBaseAndUserConfigs( baseConfig, userConfig );
	}, [ userConfig, baseConfig ] );
	const context = useMemo( () => {
		return {
			user: userConfig,
			base: baseConfig,
			merged: mergedConfig,
			setUserConfig,
		};
	}, [ mergedConfig, userConfig, baseConfig, setUserConfig ] );

	return context;
}

export function GlobalStylesProvider( { children } ) {
	const context = useGlobalStylesContext();

	return (
		<GlobalStylesContext.Provider value={ context }>
			{ children }
		</GlobalStylesContext.Provider>
	);
}
