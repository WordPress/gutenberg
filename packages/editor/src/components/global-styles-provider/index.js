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

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

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

export function useGlobalStylesContext() {
	const [ isUserConfigReady, userConfig, setUserConfig ] =
		useGlobalStylesUserConfig();
	const [ isBaseConfigReady, baseConfig ] = useGlobalStylesBaseConfig();

	const mergedConfig = useMemo( () => {
		if ( ! baseConfig || ! userConfig ) {
			return {};
		}

		return mergeGlobalStyles( baseConfig, userConfig );
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
