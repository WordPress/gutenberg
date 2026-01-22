/**
 * WordPress dependencies
 */
import {
	useMemo,
	useCallback,
	createContext,
	useContext,
} from '@wordpress/element';
import {
	mergeGlobalStyles,
	getStyle,
	getSetting,
} from '@wordpress/global-styles-engine';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

/**
 * Context for the currently editing style variation ID.
 * When null or 0, the main global styles is being edited.
 */
export const StyleVariationContext = createContext( 0 );

/**
 * Hook to fetch and manage user global styles config
 *
 * @param {number} styleVariationId Optional style variation ID. If provided, edits that style variation instead of main styles.
 */
function useGlobalStylesUserConfig( styleVariationId = 0 ) {
	const { globalStylesId, isReady, settings, styles, _links } = useSelect(
		( select ) => {
			const {
				getEntityRecord,
				getEditedEntityRecord,
				hasFinishedResolution,
				canUser,
			} = select( coreStore );

			// If editing a style variation, use that ID. Otherwise use main global styles.
			const _globalStylesId = styleVariationId
				? styleVariationId
				: select( coreStore ).__experimentalGetCurrentGlobalStylesId();

			let record;

			// For style variations, use postType entity. For main styles, use root/globalStyles.
			// Both use the same REST endpoint (/wp/v2/global-styles) but different entity tracking.
			const entityKind = styleVariationId ? 'postType' : 'root';
			const entityName = styleVariationId
				? 'wp_global_styles'
				: 'globalStyles';

			// For style variations, fetch immediately without waiting for canUser.
			// This avoids a waterfall where we wait for permission check before fetching.
			if ( styleVariationId && _globalStylesId ) {
				// Trigger the fetch.
				getEntityRecord( entityKind, entityName, _globalStylesId );
				// Use edited record to include local edits.
				record = getEditedEntityRecord(
					entityKind,
					entityName,
					_globalStylesId
				);
			} else if ( _globalStylesId ) {
				// For main global styles, use the original canUser-gated logic.
				const userCanEdit = canUser( 'update', {
					kind: entityKind,
					name: entityName,
					id: _globalStylesId,
				} );

				if ( typeof userCanEdit === 'boolean' ) {
					getEntityRecord( entityKind, entityName, _globalStylesId );

					if ( userCanEdit ) {
						record = getEditedEntityRecord(
							entityKind,
							entityName,
							_globalStylesId
						);
					} else {
						record = getEntityRecord(
							entityKind,
							entityName,
							_globalStylesId,
							{ context: 'view' }
						);
					}
				}
			}

			let hasResolved = false;
			if ( styleVariationId ) {
				// For style variations, check if the entity record has resolved.
				hasResolved = hasFinishedResolution( 'getEntityRecord', [
					entityKind,
					entityName,
					_globalStylesId,
				] );
			} else if (
				hasFinishedResolution(
					'__experimentalGetCurrentGlobalStylesId'
				)
			) {
				if ( _globalStylesId ) {
					hasResolved = hasFinishedResolution( 'getEntityRecord', [
						entityKind,
						entityName,
						_globalStylesId,
					] );
				} else {
					hasResolved = true;
				}
			}

			return {
				globalStylesId: _globalStylesId,
				isReady: hasResolved,
				settings: record?.settings,
				styles: record?.styles,
				_links: record?._links,
			};
		},
		[ styleVariationId ]
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
		( callbackOrObject, options = {} ) => {
			// For style variations, use postType entity. For main styles, use root/globalStyles.
			const entityKind = styleVariationId ? 'postType' : 'root';
			const entityName = styleVariationId
				? 'wp_global_styles'
				: 'globalStyles';

			const record = getEditedEntityRecord(
				entityKind,
				entityName,
				globalStylesId
			);

			const currentConfig = {
				styles: record?.styles ?? {},
				settings: record?.settings ?? {},
				_links: record?._links ?? {},
			};

			const updatedConfig =
				typeof callbackOrObject === 'function'
					? callbackOrObject( currentConfig )
					: callbackOrObject;

			// Both style variations and main global styles use the same format.
			const newStyles = cleanEmptyObject( updatedConfig.styles ) || {};
			const newSettings =
				cleanEmptyObject( updatedConfig.settings ) || {};

			editEntityRecord(
				entityKind,
				entityName,
				globalStylesId,
				{
					styles: newStyles,
					settings: newSettings,
				},
				options
			);
		},
		[
			globalStylesId,
			styleVariationId,
			editEntityRecord,
			getEditedEntityRecord,
		]
	);

	return [ isReady, config, setConfig ];
}

/**
 * Hook to fetch base/theme global styles config
 */
function useGlobalStylesBaseConfig() {
	const baseConfig = useSelect(
		( select ) =>
			select( coreStore ).__experimentalGetCurrentThemeBaseGlobalStyles(),
		[]
	);
	return [ !! baseConfig, baseConfig ];
}

/**
 * Hook to get merged global styles configuration
 *
 * @param {number} styleVariationId Optional style variation ID. If provided, edits that style variation.
 * @return {Object} Object containing merged, base, user configs and setUser function
 *                  { merged, base, user, setUser }
 */
export function useGlobalStyles( styleVariationId ) {
	// Use context if no styleVariationId is provided directly.
	const contextStyleVariationId = useContext( StyleVariationContext );
	const effectiveStyleVariationId =
		styleVariationId ?? contextStyleVariationId;

	const [ isUserConfigReady, userConfig, setUserConfig ] =
		useGlobalStylesUserConfig( effectiveStyleVariationId );
	const [ isBaseConfigReady, baseConfig ] = useGlobalStylesBaseConfig();

	const merged = useMemo( () => {
		if ( ! isUserConfigReady || ! isBaseConfigReady ) {
			return {};
		}
		return mergeGlobalStyles( baseConfig || {}, userConfig );
	}, [ isUserConfigReady, isBaseConfigReady, baseConfig, userConfig ] );

	return {
		merged,
		base: baseConfig || {},
		user: userConfig,
		setUser: setUserConfig,
		isReady: isUserConfigReady && isBaseConfigReady,
	};
}

/**
 * Hook to get a style value from global styles
 *
 * @param {string}  path      Style path (e.g., 'color.background')
 * @param {string=} blockName Optional block name
 * @return {*} Style value
 */
export function useStyle( path, blockName ) {
	const { merged } = useGlobalStyles();
	return useMemo(
		() => getStyle( merged, path, blockName ),
		[ merged, path, blockName ]
	);
}

/**
 * Hook to get a setting value from global styles
 *
 * @param {string}  path      Setting path (e.g., 'spacing.blockGap')
 * @param {string=} blockName Optional block name
 * @return {*} Setting value
 */
export function useSetting( path, blockName ) {
	const { merged } = useGlobalStyles();
	return useMemo(
		() => getSetting( merged, path, blockName ),
		[ merged, path, blockName ]
	);
}
