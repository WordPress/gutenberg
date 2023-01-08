/**
 * External dependencies
 */
import { mergeWith, isEmpty, mapValues } from 'lodash';

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

/* eslint-disable dot-notation, camelcase */

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
	if (
		object === null ||
		typeof object !== 'object' ||
		Array.isArray( object )
	) {
		return object;
	}
	const cleanedNestedObjects = Object.fromEntries(
		Object.entries( mapValues( object, cleanEmptyObject ) ).filter(
			( [ , value ] ) => Boolean( value )
		)
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
};

function useGlobalStylesUserConfig() {
	const { hasFinishedResolution } = useSelect( coreStore );
	const { editEntityRecord, __experimentalAssociatedVariationChanged } =
		useDispatch( coreStore );

	const { globalStylesId, isReady, settings, styles, associated_style_id } =
		useSelect( ( select ) => {
			const { getEditedEntityRecord } = select( coreStore );
			const _globalStylesId =
				select( coreStore ).__experimentalGetCurrentGlobalStylesId();
			const record = _globalStylesId
				? getEditedEntityRecord(
						'root',
						'globalStyles',
						_globalStylesId
				  )
				: undefined;
			const _associatedStyleId = record
				? record[ 'associated_style_id' ]
				: undefined;
			if (
				_associatedStyleId &&
				! __experimentalAssociatedVariationChanged()
			) {
				getEditedEntityRecord(
					'root',
					'globalStyles',
					_associatedStyleId
				);
			}

			let hasResolved = false;
			if (
				hasFinishedResolution(
					'__experimentalGetCurrentGlobalStylesId'
				)
			) {
				hasResolved = ( () => {
					if ( ! _globalStylesId ) {
						return false;
					}

					const userStyleFinishedResolution = hasFinishedResolution(
						'getEditedEntityRecord',
						[ 'root', 'globalStyles', _globalStylesId ]
					);

					if ( ! _associatedStyleId ) {
						return userStyleFinishedResolution;
					}

					const associatedStyleFinishedResolution =
						__experimentalAssociatedVariationChanged() ||
						hasFinishedResolution( 'getEditedEntityRecord', [
							'root',
							'globalStyles',
							_associatedStyleId,
						] );

					return (
						userStyleFinishedResolution &&
						associatedStyleFinishedResolution
					);
				} )();
			}

			return {
				globalStylesId: _globalStylesId,
				isReady: hasResolved,
				settings: record?.settings,
				styles: record?.styles,
				associated_style_id: _associatedStyleId,
			};
		}, [] );

	const { getEditedEntityRecord } = useSelect( coreStore );
	const config = useMemo( () => {
		return {
			settings: settings ?? {},
			styles: styles ?? {},
			associated_style_id: associated_style_id ?? null,
		};
	}, [ settings, styles, associated_style_id ] );

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
				associated_style_id: record?.associated_style_id ?? null,
			};
			const updatedConfig = callback( currentConfig );
			const updatedRecord = {
				styles: cleanEmptyObject( updatedConfig.styles ) || {},
				settings: cleanEmptyObject( updatedConfig.settings ) || {},
				associated_style_id:
					updatedConfig[ 'associated_style_id' ] || null,
			};

			let associatedStyleIdChanged = false;

			if (
				currentConfig[ 'associated_style_id' ] !==
				updatedRecord[ 'associated_style_id' ]
			) {
				associatedStyleIdChanged = true;
			}

			__experimentalAssociatedVariationChanged(
				associatedStyleIdChanged
			);

			editEntityRecord(
				'root',
				'globalStyles',
				globalStylesId,
				updatedRecord,
				options
			);

			if (
				! associatedStyleIdChanged &&
				updatedRecord[ 'associated_style_id' ]
			) {
				if (
					( ! hasFinishedResolution( 'getEditedEntityRecord' ),
					[
						'root',
						'globalStyles',
						updatedRecord[ 'associated_style_id' ],
					] )
				) {
					const intervalId = setInterval( () => {
						if (
							( hasFinishedResolution( 'getEditedEntityRecord' ),
							[
								'root',
								'globalStyles',
								updatedRecord[ 'associated_style_id' ],
							] )
						) {
							editEntityRecord(
								'root',
								'globalStyles',
								updatedRecord[ 'associated_style_id' ],
								{
									settings: updatedRecord.settings,
									styles: updatedRecord.styles,
								},
								options
							);
							clearInterval( intervalId );
						}
					}, 500 );
				} else {
					editEntityRecord(
						'root',
						'globalStyles',
						updatedRecord[ 'associated_style_id' ],
						{
							settings: updatedRecord.settings,
							styles: updatedRecord.styles,
						},
						options
					);
				}
			}
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

/* eslint-enable dot-notation, camelcase */

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
