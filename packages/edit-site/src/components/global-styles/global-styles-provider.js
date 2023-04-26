/**
 * External dependencies
 */
import { mergeWith } from 'lodash';

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
import CanvasSpinner from '../canvas-spinner';
import { unlock } from '../../private-apis';

const { GlobalStylesContext, cleanEmptyObject } = unlock(
	blockEditorPrivateApis
);

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

export function mergeConfigs( base, site, user ) {
	const baseConfig = mergeWith( {}, base, mergeTreesCustomizer );
	return mergeWith( baseConfig, site, user, mergeTreesCustomizer );
}

function useGlobalStylesSiteConfig() {
	const { siteGlobalStylesId, isReady, settings, styles } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const _siteGlobalStylesId =
				select(
					coreStore
				).__experimentalGetCurrentSiteGlobalStylesId();
			const record = _siteGlobalStylesId
				? getEditedEntityRecord(
						'root',
						'siteGlobalStyles',
						_siteGlobalStylesId
				  )
				: undefined;
			let hasResolved = false;
			if (
				hasFinishedResolution(
					'__experimentalGetCurrentSiteGlobalStylesId'
				)
			) {
				hasResolved = _siteGlobalStylesId
					? hasFinishedResolution( 'getEditedEntityRecord', [
							'root',
							'siteGlobalStyles',
							_siteGlobalStylesId,
					  ] )
					: true;
			}

			return {
				siteGlobalStylesId: _siteGlobalStylesId,
				isReady: hasResolved,
				settings: record?.settings,
				styles: record?.styles,
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
		};
	}, [ settings, styles ] );

	const setConfig = useCallback(
		( callback, options = {} ) => {
			const record = getEditedEntityRecord(
				'root',
				'siteGlobalStyles',
				siteGlobalStylesId
			);
			const currentConfig = {
				styles: record?.styles ?? {},
				settings: record?.settings ?? {},
			};
			const updatedConfig = callback( currentConfig );
			editEntityRecord(
				'root',
				'siteGlobalStyles',
				siteGlobalStylesId,
				{
					styles: cleanEmptyObject( updatedConfig.styles ) || {},
					settings: cleanEmptyObject( updatedConfig.settings ) || {},
				},
				options
			);
		},
		[ siteGlobalStylesId ]
	);

	return [ isReady, config, setConfig ];
}

function useGlobalStylesUserConfig() {
	const { globalStylesId, isReady, settings, styles } = useSelect(
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
		};
	}, [ settings, styles ] );

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
			};
			const updatedConfig = callback( currentConfig );
			editEntityRecord(
				'root',
				'globalStyles',
				globalStylesId,
				{
					styles: cleanEmptyObject( updatedConfig.styles ) || {},
					settings: cleanEmptyObject( updatedConfig.settings ) || {},
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
	const [ isSiteConfigReady, siteConfig, setSiteConfig ] =
		useGlobalStylesSiteConfig();

	const mergedConfig = useMemo( () => {
		if ( ! baseConfig || ! userConfig || ! siteConfig ) {
			return {};
		}
		return mergeConfigs( baseConfig, siteConfig, userConfig );
	}, [ userConfig, baseConfig, siteConfig ] );

	const context = useMemo( () => {
		return {
			isReady:
				isUserConfigReady && isBaseConfigReady && isSiteConfigReady,
			site: siteConfig,
			user: userConfig,
			base: baseConfig,
			merged: mergedConfig,
			setUserConfig,
			setSiteConfig,
		};
	}, [
		mergedConfig,
		userConfig,
		siteConfig,
		baseConfig,
		setUserConfig,
		setSiteConfig,
		isUserConfigReady,
		isBaseConfigReady,
		isSiteConfigReady,
	] );

	return context;
}

export function GlobalStylesProvider( { children } ) {
	const context = useGlobalStylesContext();
	if ( ! context.isReady ) {
		return <CanvasSpinner />;
	}

	return (
		<GlobalStylesContext.Provider value={ context }>
			{ children }
		</GlobalStylesContext.Provider>
	);
}
