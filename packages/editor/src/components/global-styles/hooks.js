/**
 * WordPress dependencies
 */
import { useMemo, useCallback, useContext } from '@wordpress/element';
import {
	mergeGlobalStyles,
	getStyle,
	getSetting,
} from '@wordpress/global-styles-engine';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { TemplateStyleVariationContext } from '../template-style-variation-context';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

/**
 * Preset setting keys that use origin-based format in the merged config.
 * E.g., settings.color.palette = { default: [], theme: [], custom: [] }
 *
 * Base theme data from the REST API uses flat arrays instead.
 * This map defines: settingsPath -> presetKey for each preset type.
 */
const ORIGIN_BASED_PRESETS = [
	[ 'color', 'palette' ],
	[ 'color', 'gradients' ],
	[ 'color', 'duotone' ],
	[ 'typography', 'fontSizes' ],
	[ 'typography', 'fontFamilies' ],
	[ 'spacing', 'spacingSizes' ],
	[ 'shadow', 'presets' ],
];

/**
 * Converts flat-array presets in settings to origin-based format
 * so they merge correctly with the editor's merged config.
 *
 * E.g., { color: { palette: [...] } }
 * becomes { color: { palette: { theme: [...] } } }
 *
 * @param {Object|null} settings The settings object from a base theme.
 * @return {Object} Settings with presets nested under the "theme" origin.
 */
function nestPresetsUnderThemeOrigin( settings ) {
	if ( ! settings ) {
		return {};
	}
	const result = { ...settings };
	for ( const [ category, presetKey ] of ORIGIN_BASED_PRESETS ) {
		if ( Array.isArray( result[ category ]?.[ presetKey ] ) ) {
			result[ category ] = {
				...result[ category ],
				[ presetKey ]: {
					theme: result[ category ][ presetKey ],
				},
			};
		}
	}
	return result;
}

/**
 * Hook to fetch and manage user global styles config
 */
function useGlobalStylesUserConfig() {
	const { globalStylesId, isReady, settings, styles, _links } = useSelect(
		( select ) => {
			const {
				getEntityRecord,
				getEditedEntityRecord,
				hasFinishedResolution,
				canUser,
			} = select( coreStore );
			const _globalStylesId =
				select( coreStore ).__experimentalGetCurrentGlobalStylesId();

			let record;

			const userCanEditGlobalStyles = _globalStylesId
				? canUser( 'update', {
						kind: 'root',
						name: 'globalStyles',
						id: _globalStylesId,
				  } )
				: null;

			if (
				_globalStylesId &&
				typeof userCanEditGlobalStyles === 'boolean'
			) {
				if ( userCanEditGlobalStyles ) {
					record = getEditedEntityRecord(
						'root',
						'globalStyles',
						_globalStylesId
					);
				} else {
					record = getEntityRecord(
						'root',
						'globalStyles',
						_globalStylesId,
						{ context: 'view' }
					);
				}
			}

			let hasResolved = false;
			if (
				hasFinishedResolution(
					'__experimentalGetCurrentGlobalStylesId'
				)
			) {
				if ( _globalStylesId ) {
					hasResolved = userCanEditGlobalStyles
						? hasFinishedResolution( 'getEditedEntityRecord', [
								'root',
								'globalStyles',
								_globalStylesId,
						  ] )
						: hasFinishedResolution( 'getEntityRecord', [
								'root',
								'globalStyles',
								_globalStylesId,
								{ context: 'view' },
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
		( callbackOrObject, options = {} ) => {
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

			const updatedConfig =
				typeof callbackOrObject === 'function'
					? callbackOrObject( currentConfig )
					: callbackOrObject;

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
		[ globalStylesId, editEntityRecord, getEditedEntityRecord ]
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
 * This hook is template-aware: when editing a template with an associated
 * style variation, it will use the variation's styles instead of the default
 * global styles. If the variation has an associated wp_global_styles post,
 * edits are saved to that post; otherwise, a post is created on first save.
 *
 * @return {Object} Object containing merged, base, user configs and setUser function
 *                  { merged, base, user, setUser }
 */
export function useGlobalStyles() {
	const {
		templateId,
		styleVariationId,
		styleVariationPostId,
		baseThemeId,
		isTemplateStyleVariationsEnabled,
	} = useContext( TemplateStyleVariationContext );

	// Get variation post data if we have a post ID.
	const variationPostData = useSelect(
		( select ) => {
			if (
				! styleVariationPostId ||
				! isTemplateStyleVariationsEnabled
			) {
				return null;
			}

			const {
				getEntityRecord,
				getEditedEntityRecord,
				hasFinishedResolution,
			} = select( coreStore );

			// First, trigger the fetch by calling getEntityRecord.
			// This ensures the entity is loaded from the server.
			getEntityRecord( 'root', 'globalStyles', styleVariationPostId );

			const hasResolved = hasFinishedResolution( 'getEntityRecord', [
				'root',
				'globalStyles',
				styleVariationPostId,
			] );

			if ( ! hasResolved ) {
				return null;
			}

			// Now get the edited record which includes any local edits.
			const record = getEditedEntityRecord(
				'root',
				'globalStyles',
				styleVariationPostId
			);

			if ( ! record ) {
				return null;
			}

			return {
				settings: record.settings ?? {},
				styles: record.styles ?? {},
				_links: record._links ?? {},
			};
		},
		[ styleVariationPostId, isTemplateStyleVariationsEnabled ]
	);

	// Get registered variation data. We always fetch this when we have a variation ID,
	// because we need it both for initial display (before post exists) and for reset functionality.
	const registeredVariationData = useSelect(
		( select ) => {
			if ( ! styleVariationId || ! isTemplateStyleVariationsEnabled ) {
				return null;
			}

			const getRegisteredVariations =
				select( coreStore ).__experimentalGetRegisteredStyleVariations;
			if ( typeof getRegisteredVariations !== 'function' ) {
				return null;
			}

			const variations = getRegisteredVariations() || [];
			return (
				variations.find( ( v ) => v.id === styleVariationId ) || null
			);
		},
		[ styleVariationId, isTemplateStyleVariationsEnabled ]
	);

	// Fetch base theme data if the variation specifies one.
	const baseThemeData = useSelect(
		( select ) => {
			if ( ! baseThemeId || ! isTemplateStyleVariationsEnabled ) {
				return null;
			}

			const getBaseThemes =
				select( coreStore ).__experimentalGetBaseThemes;
			if ( typeof getBaseThemes !== 'function' ) {
				return null;
			}

			const baseThemes = getBaseThemes() || [];
			return baseThemes.find( ( bt ) => bt.id === baseThemeId ) || null;
		},
		[ baseThemeId, isTemplateStyleVariationsEnabled ]
	);

	const [ isUserConfigReady, defaultUserConfig, setDefaultUserConfig ] =
		useGlobalStylesUserConfig();
	const [ isBaseConfigReady, defaultBaseConfig ] =
		useGlobalStylesBaseConfig();

	// When a base theme is specified, merge its settings/styles on top of
	// the default base config. This replaces theme-level values (palette,
	// font families, etc.) with the base theme's values while keeping core
	// defaults intact.
	//
	// Base theme settings from the REST API use flat arrays for presets
	// (e.g., settings.color.palette = []). The merged config uses origin-based
	// format (e.g., settings.color.palette = { default: [], theme: [], custom: [] }).
	// We must nest them under the "theme" origin so mergeGlobalStyles replaces
	// the theme's presets without destroying the origin structure.
	const baseConfig = useMemo( () => {
		if ( baseThemeData && defaultBaseConfig ) {
			const normalizedSettings = nestPresetsUnderThemeOrigin(
				baseThemeData.settings
			);
			return mergeGlobalStyles( defaultBaseConfig, {
				settings: normalizedSettings,
				styles: baseThemeData.styles ?? {},
			} );
		}
		return defaultBaseConfig;
	}, [ baseThemeData, defaultBaseConfig ] );

	const { editEntityRecord } = useDispatch( coreStore );
	const { getEditedEntityRecord } = useSelect( coreStore );
	const registry = useRegistry();

	// Determine the effective user config based on variation state.
	const effectiveUserConfig = useMemo( () => {
		// Priority 1: Use variation post data if it exists.
		if ( variationPostData ) {
			return variationPostData;
		}
		// Priority 2: Use registered variation data if no post yet.
		if ( registeredVariationData ) {
			return {
				settings: registeredVariationData.settings ?? {},
				styles: registeredVariationData.styles ?? {},
				_links: {},
			};
		}
		// Priority 3: Fall back to default global styles.
		return defaultUserConfig;
	}, [ variationPostData, registeredVariationData, defaultUserConfig ] );

	const { invalidateResolution } = useDispatch( coreStore );

	// Create a custom setConfig that handles variation posts.
	const setUserConfig = useCallback(
		async ( callbackOrObject, options = {} ) => {
			// If we have a style variation, we should save to the variation post,
			// NEVER to the default global styles.
			if ( styleVariationId && isTemplateStyleVariationsEnabled ) {
				let targetPostId = styleVariationPostId;

				// If we don't have a post ID yet, create one.
				if ( ! targetPostId ) {
					try {
						// Call the API to create the variation post.
						// Pass the variation ID directly since the template may not be
						// customized yet (no wp_id), so we can't look it up from meta.
						const response = await apiFetch( {
							path: `/wp/v2/templates-variation-post/${ encodeURIComponent(
								templateId
							) }`,
							method: 'POST',
							data: {
								variation_id: styleVariationId,
							},
						} );

						if ( response?.post_id ) {
							targetPostId = response.post_id;

							// Fetch the new entity into the store so
							// editEntityRecord can find the raw record.
							// Without this, getRawEntityRecord returns
							// undefined and editEntityRecord throws.
							await registry
								.resolveSelect( coreStore )
								.getEntityRecord(
									'root',
									'globalStyles',
									targetPostId
								);

							// Invalidate the registered variations cache so it refetches
							// with the new post_id. This updates the context for subsequent edits.
							invalidateResolution(
								'__experimentalGetRegisteredStyleVariations',
								[]
							);
						}
					} catch {
						// If we can't create a post, don't save anything.
						// This prevents accidentally editing the default global styles.
						// eslint-disable-next-line no-console
						console.error(
							'Failed to create variation post for style variation:',
							styleVariationId
						);
						return;
					}
				}

				// If we have a target post ID, save to it.
				if ( targetPostId ) {
					const record = getEditedEntityRecord(
						'root',
						'globalStyles',
						targetPostId
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

					editEntityRecord(
						'root',
						'globalStyles',
						targetPostId,
						{
							styles:
								cleanEmptyObject( updatedConfig.styles ) || {},
							settings:
								cleanEmptyObject( updatedConfig.settings ) ||
								{},
							_links:
								cleanEmptyObject( updatedConfig._links ) || {},
						},
						options
					);
					return;
				}

				// If we still don't have a post ID, don't save anything.
				// This should not happen, but prevents editing the default.
				return;
			}

			// Default behavior: save to global styles (no variation selected).
			setDefaultUserConfig( callbackOrObject, options );
		},
		[
			templateId,
			styleVariationId,
			styleVariationPostId,
			isTemplateStyleVariationsEnabled,
			editEntityRecord,
			invalidateResolution,
			getEditedEntityRecord,
			setDefaultUserConfig,
			registry,
		]
	);

	const merged = useMemo( () => {
		if ( ! isUserConfigReady || ! isBaseConfigReady ) {
			return {};
		}
		return mergeGlobalStyles( baseConfig || {}, effectiveUserConfig );
	}, [
		isUserConfigReady,
		isBaseConfigReady,
		baseConfig,
		effectiveUserConfig,
	] );

	// Get the registered variation's original data for reset functionality.
	// This is the data the variation was registered with, before any user edits.
	const registeredVariationBaseData = useMemo( () => {
		if ( ! styleVariationId || ! isTemplateStyleVariationsEnabled ) {
			return null;
		}
		// Return the registered variation data (not the post data which may have edits).
		if ( registeredVariationData ) {
			return {
				settings: registeredVariationData.settings ?? {},
				styles: registeredVariationData.styles ?? {},
			};
		}
		return null;
	}, [
		styleVariationId,
		isTemplateStyleVariationsEnabled,
		registeredVariationData,
	] );

	return {
		merged,
		base: baseConfig || {},
		user: effectiveUserConfig,
		setUser: setUserConfig,
		isReady: isUserConfigReady && isBaseConfigReady,
		// Expose variation-specific data for reset and other operations.
		styleVariationId,
		registeredVariationBaseData,
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
