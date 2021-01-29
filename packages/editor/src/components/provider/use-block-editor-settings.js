/**
 * External dependencies
 */
import { map, pick, defaultTo, flatten, partialRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { Platform, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { mediaUpload } from '../../utils';
import { store as editorStore } from '../../store';

/**
 * Fetches link suggestions from the API. This function is an exact copy of a function found at:
 *
 * packages/edit-navigation/src/index.js
 *
 * It seems like there is no suitable package to import this from. Ideally it would be either part of core-data.
 * Until we refactor it, just copying the code is the simplest solution.
 *
 * @param {string} search
 * @param {Object} [searchArguments]
 * @param {number} [searchArguments.isInitialSuggestions]
 * @param {number} [searchArguments.type]
 * @param {number} [searchArguments.subtype]
 * @param {number} [searchArguments.page]
 * @param {Object} [editorSettings]
 * @param {boolean} [editorSettings.disablePostFormats=false]
 * @return {Promise<Object[]>} List of suggestions
 */

const fetchLinkSuggestions = async (
	search,
	{ isInitialSuggestions, type, subtype, page, perPage: perPageArg } = {},
	{ disablePostFormats = false } = {}
) => {
	const perPage = perPageArg || isInitialSuggestions ? 3 : 20;

	const queries = [];

	if ( ! type || type === 'post' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'post',
					subtype,
				} ),
			} ).catch( () => [] ) // fail by returning no results
		);
	}

	if ( ! type || type === 'term' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'term',
					subtype,
				} ),
			} ).catch( () => [] )
		);
	}

	if ( ! disablePostFormats && ( ! type || type === 'post-format' ) ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'post-format',
					subtype,
				} ),
			} ).catch( () => [] )
		);
	}

	return Promise.all( queries ).then( ( results ) => {
		return map(
			flatten( results )
				.filter( ( result ) => !! result.id )
				.slice( 0, perPage ),
			( result ) => ( {
				id: result.id,
				url: result.url,
				title: decodeEntities( result.title ) || __( '(no title)' ),
				type: result.subtype || result.type,
			} )
		);
	} );
};

/**
 * React hook used to compute the block editor settings to use for the post editor.
 *
 * @param {Object}  settings    EditorProvider settings prop.
 * @param {boolean} hasTemplate Whether template mode is enabled.
 *
 * @return {Object} Block Editor Settings.
 */
function useBlockEditorSettings( settings, hasTemplate ) {
	const {
		reusableBlocks,
		hasUploadPermissions,
		canUseUnfilteredHTML,
		isTitleSelected,
	} = useSelect( ( select ) => {
		const { canUserUseUnfilteredHTML, isPostTitleSelected } = select(
			editorStore
		);
		const { canUser } = select( coreStore );
		return {
			canUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			reusableBlocks: select( 'core' ).getEntityRecords(
				'postType',
				'wp_block',
				/**
				 * Unbounded queries are not supported on native so as a workaround we set per_page with the maximum value.
				 * Related issue: https://github.com/wordpress-mobile/gutenberg-mobile/issues/2661
				 */
				{ per_page: Platform.select( { web: -1, native: 100 } ) }
			),
			hasUploadPermissions: defaultTo(
				canUser( 'create', 'media' ),
				true
			),
			// This selector is only defined on mobile.
			isTitleSelected: isPostTitleSelected && isPostTitleSelected(),
		};
	}, [] );

	const { undo } = useDispatch( editorStore );

	return useMemo(
		() => ( {
			...pick( settings, [
				'__experimentalBlockDirectory',
				'__experimentalBlockPatterns',
				'__experimentalBlockPatternCategories',
				'__experimentalFeatures',
				'__experimentalGlobalStylesUserEntityId',
				'__experimentalGlobalStylesBaseStyles',
				'__experimentalPreferredStyleVariations',
				'__experimentalSetIsInserterOpened',
				'alignWide',
				'allowedBlockTypes',
				'availableLegacyWidgets',
				'bodyPlaceholder',
				'codeEditingEnabled',
				'colors',
				'disableCustomColors',
				'disableCustomFontSizes',
				'disableCustomGradients',
				'enableCustomUnits',
				'enableCustomLineHeight',
				'focusMode',
				'fontSizes',
				'gradients',
				'hasFixedToolbar',
				'hasReducedUI',
				'imageEditing',
				'imageSizes',
				'imageDimensions',
				'isRTL',
				'keepCaretInsideBlock',
				'maxWidth',
				'onUpdateDefaultBlockStyles',
				'styles',
				'template',
				'templateLock',
				'titlePlaceholder',
			] ),
			mediaUpload: hasUploadPermissions ? mediaUpload : undefined,
			__experimentalReusableBlocks: reusableBlocks,
			__experimentalFetchLinkSuggestions: partialRight(
				fetchLinkSuggestions,
				settings
			),
			__experimentalCanUserUseUnfilteredHTML: canUseUnfilteredHTML,
			__experimentalUndo: undo,
			__experimentalShouldInsertAtTheTop: isTitleSelected,
			outlineMode: hasTemplate,
		} ),
		[
			settings,
			hasUploadPermissions,
			reusableBlocks,
			canUseUnfilteredHTML,
			undo,
			isTitleSelected,
			hasTemplate,
		]
	);
}

export default useBlockEditorSettings;
