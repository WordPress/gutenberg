/**
 * External dependencies
 */
import deepmerge from 'deepmerge';
import { isPlainObject } from 'is-plain-object';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { GlobalStylesContext, cleanEmptyObject } = unlock(
	blockEditorPrivateApis
);

export function mergeBaseAndUserConfigs( base, user ) {
	return deepmerge( base, user, {
		// We only pass as arrays the presets,
		// in which case we want the new array of values
		// to override the old array (no merging).
		isMergeableObject: isPlainObject,
	} );
}

function useGlobalStylesUserConfig() {
	const { globalStylesId, isReady, settings, styles, behaviors } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const _globalStylesId =
				select( coreStore ).__experimentalGetCurrentGlobalStylesId();
			const record = _globalStylesId
				? getEditedEntityRecord(
						'root',
						'globalStyles',
						_globalStylesId
				  )
				: undefined;

			let hasResolved = false;
			if (
				hasFinishedResolution(
					'__experimentalGetCurrentGlobalStylesId'
				)
			) {
				hasResolved = _globalStylesId
					? hasFinishedResolution( 'getEditedEntityRecord', [
							'root',
							'globalStyles',
							_globalStylesId,
					  ] )
					: true;
			}

			return {
				globalStylesId: _globalStylesId,
				isReady: hasResolved,
				settings: record?.settings,
				styles: record?.styles,
				behaviors: record?.behaviors,
			};
		},
		[]
	);

	const { getEditedEntityRecord } = useSelect( coreStore );
	const { editEntityRecord } = useDispatch( coreStore );
	const config = useMemo( () => {
		return {
			settings: settings ?? {},
			styles: styles ?? {},
			behaviors: behaviors ?? {},
		};
	}, [ settings, styles, behaviors ] );

	const setConfig = useCallback(
		( callback, options = {} ) => {
			const record = getEditedEntityRecord(
				'root',
				'globalStyles',
				globalStylesId
			);
			const currentConfig = {
				styles: record?.styles ?? {},
				settings: record?.settings ?? {},
				behaviors: record?.behaviors ?? {},
			};
			const updatedConfig = callback( currentConfig );
			editEntityRecord(
				'root',
				'globalStyles',
				globalStylesId,
				{
					styles: cleanEmptyObject( updatedConfig.styles ) || {},
					settings: cleanEmptyObject( updatedConfig.settings ) || {},
					behaviors:
						cleanEmptyObject( updatedConfig.behaviors ) || {},
				},
				options
			);
		},
		[ globalStylesId ]
	);

	return [ isReady, config, setConfig ];
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
	const [ isUserConfigReady, userConfig, setUserConfig ] =
		useGlobalStylesUserConfig();
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
