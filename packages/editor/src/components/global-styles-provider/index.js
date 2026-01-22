/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { mergeGlobalStyles } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

const STYLE_VARIATION_META_KEY = '_wp_connected_style_variation';

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

			/*
			 * Ensure that the global styles ID request is complete by testing `_globalStylesId`,
			 * before firing off the `canUser` OPTIONS request for user capabilities, otherwise it will
			 * fetch `/wp/v2/global-styles` instead of `/wp/v2/global-styles/{id}`.
			 * NOTE: Please keep in sync any preload paths sent to `block_editor_rest_api_preload()`,
			 * or set using the `block_editor_rest_api_preload_paths` filter, if this changes.
			 */
			const userCanEditGlobalStyles = _globalStylesId
				? canUser( 'update', {
						kind: 'root',
						name: 'globalStyles',
						id: _globalStylesId,
				  } )
				: null;

			if (
				_globalStylesId &&
				/*
				 * Test that the OPTIONS request for user capabilities is complete
				 * before fetching the global styles entity record.
				 * This is to avoid fetching the global styles entity unnecessarily.
				 */
				typeof userCanEditGlobalStyles === 'boolean'
			) {
				/*
				 * Fetch the global styles entity record based on the user's capabilities.
				 * The default context is `edit` for users who can edit global styles.
				 * Otherwise, the context is `view`.
				 * NOTE: There is an equivalent conditional check using `current_user_can()` in the backend
				 * to preload the global styles entity. Please keep in sync any preload paths sent to `block_editor_rest_api_preload()`,
				 * or set using `block_editor_rest_api_preload_paths` filter, if this changes.
				 */
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
		/**
		 * Set the global styles config.
		 * @param {Function|Object} callbackOrObject If the callbackOrObject is a function, pass the current config to the callback so the consumer can merge values.
		 *                                           Otherwise, overwrite the current config with the incoming object.
		 * @param {Object}          options          Options for editEntityRecord Core selector.
		 */
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

function useGlobalStylesBaseConfig() {
	const baseConfig = useSelect(
		( select ) =>
			select( coreStore ).__experimentalGetCurrentThemeBaseGlobalStyles(),
		[]
	);
	return [ !! baseConfig, baseConfig ];
}

/**
 * Hook to fetch the connected style variation's config for the current post.
 * This allows the editor to render with the style variation's styles when a post
 * is linked to a style variation.
 *
 * @param {string} postType Optional post type. If not provided, uses editor store.
 * @param {string} postId   Optional post ID. If not provided, uses editor store.
 * @return {Array} Tuple of [isReady, connectedStyleVariationId, styleVariationConfig].
 */
function useConnectedStyleVariationConfig( postType, postId ) {
	// First, get the connected style variation ID from the current post's meta.
	const connectedStyleVariationId = useSelect(
		( select ) => {
			const editorSelectors = select( editorStore );

			// Safely get current post info.
			const currentPostId =
				postId ?? editorSelectors?.getCurrentPostId?.();
			const currentPostType =
				postType ?? editorSelectors?.getCurrentPostType?.();

			if ( ! currentPostId || ! currentPostType ) {
				return 0;
			}

			const { getEditedEntityRecord } = select( coreStore );
			const post = getEditedEntityRecord(
				'postType',
				currentPostType,
				currentPostId
			);

			return post?.meta?.[ STYLE_VARIATION_META_KEY ] || 0;
		},
		[ postType, postId ]
	);

	// Separately fetch the style variation if we have an ID.
	const { styleVariationConfig, isReady } = useSelect(
		( select ) => {
			if ( ! connectedStyleVariationId ) {
				return {
					styleVariationConfig: null,
					isReady: true,
				};
			}

			const { getEntityRecord, hasFinishedResolution } =
				select( coreStore );

			// Fetch the style variation.
			const styleVariation = getEntityRecord(
				'postType',
				'wp_global_styles',
				connectedStyleVariationId
			);

			const hasResolved = hasFinishedResolution( 'getEntityRecord', [
				'postType',
				'wp_global_styles',
				connectedStyleVariationId,
			] );

			const config =
				styleVariation && hasResolved
					? {
							settings: styleVariation.settings ?? {},
							styles: styleVariation.styles ?? {},
					  }
					: null;

			return {
				styleVariationConfig: config,
				isReady: hasResolved,
			};
		},
		[ connectedStyleVariationId ]
	);

	return [ isReady, connectedStyleVariationId, styleVariationConfig ];
}

/**
 * Hook to get the global styles context, including connected style variation if applicable.
 *
 * @param {string} postType Optional post type for connected style variation lookup.
 * @param {string} postId   Optional post ID for connected style variation lookup.
 * @return {Object} Global styles context.
 */
export function useGlobalStylesContext( postType, postId ) {
	const [ isUserConfigReady, userConfig, setUserConfig ] =
		useGlobalStylesUserConfig();
	const [ isBaseConfigReady, baseConfig ] = useGlobalStylesBaseConfig();
	const [
		isStyleVariationReady,
		connectedStyleVariationId,
		styleVariationConfig,
	] = useConnectedStyleVariationConfig( postType, postId );

	const mergedConfig = useMemo( () => {
		if ( ! baseConfig || ! userConfig ) {
			return {};
		}

		// First merge base with user config (main global styles).
		const baseUserMerged = mergeGlobalStyles( baseConfig, userConfig );

		// If there's a connected style variation, merge its config on top.
		if ( connectedStyleVariationId && styleVariationConfig ) {
			return mergeGlobalStyles( baseUserMerged, styleVariationConfig );
		}

		return baseUserMerged;
	}, [
		userConfig,
		baseConfig,
		connectedStyleVariationId,
		styleVariationConfig,
	] );

	const context = useMemo( () => {
		return {
			isReady:
				isUserConfigReady && isBaseConfigReady && isStyleVariationReady,
			user: userConfig,
			base: baseConfig,
			merged: mergedConfig,
			setUserConfig,
			connectedStyleVariationId,
		};
	}, [
		mergedConfig,
		userConfig,
		baseConfig,
		setUserConfig,
		isUserConfigReady,
		isBaseConfigReady,
		isStyleVariationReady,
		connectedStyleVariationId,
	] );

	return context;
}
