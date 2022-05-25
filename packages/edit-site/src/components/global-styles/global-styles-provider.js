/**
 * External dependencies
 */
import {
	mergeWith,
	pickBy,
	isEmpty,
	isObject,
	identity,
	mapValues,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { GlobalStylesContext } from './context';

function mergeTreesCustomizer( _, srcValue ) {
	// We only pass as arrays the presets,
	// in which case we want the new array of values
	// to override the old array (no merging).
	if ( Array.isArray( srcValue ) ) {
		return srcValue;
	}
}

export function mergeBaseAndUserConfigs( base, user ) {
	return mergeWith( {}, base, user, mergeTreesCustomizer );
}

const cleanEmptyObject = ( object ) => {
	if ( ! isObject( object ) || Array.isArray( object ) ) {
		return object;
	}
	const cleanedNestedObjects = pickBy(
		mapValues( object, cleanEmptyObject ),
		identity
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
};

function useGlobalStylesUserConfig() {
	const { globalStylesId, settings, styles } = useSelect( ( select ) => {
		const _globalStylesId = select(
			coreStore
		).__experimentalGetCurrentGlobalStylesId();
		const record = _globalStylesId
			? select( coreStore ).getEditedEntityRecord(
					'root',
					'globalStyles',
					_globalStylesId
			  )
			: undefined;
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
			settings: settings ?? {},
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
				settings: record?.settings ?? {},
			};
			const updatedConfig = callback( currentConfig );
			editEntityRecord( 'root', 'globalStyles', globalStylesId, {
				styles: cleanEmptyObject( updatedConfig.styles ) || {},
				settings: cleanEmptyObject( updatedConfig.settings ) || {},
			} );
		},
		[ globalStylesId ]
	);

	return [ !! settings || !! styles, config, setConfig ];
}

function useGlobalStylesBaseConfig() {
	const baseConfig = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeBaseGlobalStyles();
	}, [] );

	return [ !! baseConfig, baseConfig ];
}

function useGlobalStylesContext() {
	const [
		isUserConfigReady,
		userConfig,
		setUserConfig,
	] = useGlobalStylesUserConfig();
	const [ isBaseConfigReady, baseConfig ] = useGlobalStylesBaseConfig();
	const mergedConfig = useMemo( () => {
		if ( ! baseConfig || ! userConfig ) {
			return {};
		}
		return mergeBaseAndUserConfigs( baseConfig, userConfig );
	}, [ userConfig, baseConfig ] );
	const context = useMemo( () => {
		return {
			isReady: isUserConfigReady && isBaseConfigReady,
			user: userConfig,
			base: baseConfig,
			merged: mergedConfig,
			setUserConfig,
		};
	}, [
		mergedConfig,
		userConfig,
		baseConfig,
		setUserConfig,
		isUserConfigReady,
		isBaseConfigReady,
	] );

	return context;
}

export function GlobalStylesProvider( { children } ) {
	const context = useGlobalStylesContext();
	if ( ! context.isReady ) {
		return null;
	}

	return (
		<GlobalStylesContext.Provider value={ context }>
			{ children }
		</GlobalStylesContext.Provider>
	);
}
