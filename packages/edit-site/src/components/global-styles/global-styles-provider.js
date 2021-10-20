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
	const { globalStylesId, settings, styles } = useSelect( ( select ) => {
		const _globalStylesId = select( editSiteStore ).getSettings()
			.__experimentalGlobalStylesUserEntityId;
		const record = select( coreStore ).getEditedEntityRecord(
			'root',
			'globalStyles',
			_globalStylesId
		);
		return {
			globalStylesId: _globalStylesId,
			settings: record?.settings,
			styles: record?.styles,
		};
	}, [] );
	const { getEditedEntityRecord } = useSelect( coreStore );
	const { editEntityRecord } = useDispatch( coreStore );

	const config = useMemo( () => {
		return {
			settings: addUserOriginToSettings( settings ?? {} ),
			styles: styles ?? {},
		};
	}, [ settings, styles ] );

	const setConfig = useCallback(
		( callback ) => {
			const record = getEditedEntityRecord(
				'root',
				'globalStyles',
				globalStylesId
			);
			const currentConfig = {
				styles: record?.styles ?? {},
				settings: addUserOriginToSettings( record?.settings ?? {} ),
			};
			const updatedConfig = callback( currentConfig );
			editEntityRecord( 'root', 'globalStyles', globalStylesId, {
				styles: updatedConfig.styles,
				settings: removeUserOriginFromSettings(
					updatedConfig.settings
				),
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
