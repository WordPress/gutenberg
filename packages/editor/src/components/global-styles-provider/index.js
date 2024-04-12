/**
 * External dependencies
 */
import deepmerge from 'deepmerge';
import { isPlainObject } from 'is-plain-object';

/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import cloneDeep from '../../utils/clone-deep';
import setNestedValue from '../../utils/set-nested-value';

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

function resolveBlockStyleVariations( userConfig ) {
	const sharedVariations = userConfig.styles?.blocks?.variations;

	if ( ! sharedVariations ) {
		return userConfig;
	}

	const variationsConfig = cloneDeep( userConfig );

	Object.entries( sharedVariations ).forEach(
		( [ variationName, variation ] ) => {
			if ( ! variation?.supportedBlockTypes ) {
				return;
			}

			variation.supportedBlockTypes.forEach( ( blockName ) => {
				const path = [
					'styles',
					'blocks',
					blockName,
					'variations',
					variationName,
				];
				setNestedValue( variationsConfig, path, variation );
			} );
		}
	);

	return deepmerge( variationsConfig, userConfig );
}

function useGlobalStylesUserConfig() {
	const { globalStylesId, isReady, settings, styles, _links } = useSelect(
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
				_links: record?._links,
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
			_links: _links ?? {},
		};
	}, [ settings, styles, _links ] );

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
				_links: record?._links ?? {},
			};
			const updatedConfig = callback( currentConfig );

			editEntityRecord(
				'root',
				'globalStyles',
				globalStylesId,
				{
					styles: cleanEmptyObject( updatedConfig.styles ) || {},
					settings: cleanEmptyObject( updatedConfig.settings ) || {},
					_links: cleanEmptyObject( updatedConfig._links ) || {},
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

export function useGlobalStylesContext() {
	const [ isUserConfigReady, userConfig, setUserConfig ] =
		useGlobalStylesUserConfig();
	const [ isBaseConfigReady, baseConfig ] = useGlobalStylesBaseConfig();

	const userConfigWithVariations = useMemo( () => {
		if ( ! userConfig ) {
			return userConfig;
		}
		return resolveBlockStyleVariations( userConfig );
	}, [ userConfig ] );

	const mergedConfig = useMemo( () => {
		if ( ! baseConfig || ! userConfigWithVariations ) {
			return {};
		}

		return mergeBaseAndUserConfigs( baseConfig, userConfigWithVariations );
	}, [ userConfigWithVariations, baseConfig ] );

	const context = useMemo( () => {
		return {
			isReady: isUserConfigReady && isBaseConfigReady,
			user: userConfigWithVariations,
			base: baseConfig,
			merged: mergedConfig,
			setUserConfig,
		};
	}, [
		mergedConfig,
		userConfigWithVariations,
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
