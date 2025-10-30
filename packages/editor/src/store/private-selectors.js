/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal';

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createSelector, createRegistrySelector } from '@wordpress/data';
import {
	layout,
	symbol,
	navigation,
	page as pageIcon,
	verse,
} from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { getRenderingMode, getCurrentPost } from './selectors';
import {
	getEntityActions as _getEntityActions,
	getEntityFields as _getEntityFields,
	isEntityReady as _isEntityReady,
} from '../dataviews/store/private-selectors';
import { getTemplatePartIcon } from '../utils';

const EMPTY_INSERTION_POINT = {
	rootClientId: undefined,
	insertionIndex: undefined,
	filterValue: undefined,
};

/**
 * These are rendering modes that the editor supports.
 */
const RENDERING_MODES = [ 'post-only', 'template-locked' ];

/**
 * Get the inserter.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID, index to insert at and starting filter value.
 */
export const getInserter = createRegistrySelector( ( select ) =>
	createSelector(
		( state ) => {
			if ( typeof state.blockInserterPanel === 'object' ) {
				return state.blockInserterPanel;
			}

			if ( getRenderingMode( state ) === 'template-locked' ) {
				const [ postContentClientId ] =
					select( blockEditorStore ).getBlocksByName(
						'core/post-content'
					);
				if ( postContentClientId ) {
					return {
						rootClientId: postContentClientId,
						insertionIndex: undefined,
						filterValue: undefined,
					};
				}
			}

			return EMPTY_INSERTION_POINT;
		},
		( state ) => {
			const [ postContentClientId ] =
				select( blockEditorStore ).getBlocksByName(
					'core/post-content'
				);
			return [
				state.blockInserterPanel,
				getRenderingMode( state ),
				postContentClientId,
			];
		}
	)
);

export function getListViewToggleRef( state ) {
	return state.listViewToggleRef;
}
export function getInserterSidebarToggleRef( state ) {
	return state.inserterSidebarToggleRef;
}
const CARD_ICONS = {
	wp_block: symbol,
	wp_navigation: navigation,
	page: pageIcon,
	post: verse,
};

export const getPostIcon = createRegistrySelector(
	( select ) => ( state, postType, options ) => {
		{
			if (
				postType === 'wp_template_part' ||
				postType === 'wp_template'
			) {
				const templateAreas =
					select( coreStore ).getCurrentTheme()
						?.default_template_part_areas || [];

				const areaData = templateAreas.find(
					( item ) => options.area === item.area
				);

				if ( areaData?.icon ) {
					return getTemplatePartIcon( areaData.icon );
				}

				return layout;
			}
			if ( CARD_ICONS[ postType ] ) {
				return CARD_ICONS[ postType ];
			}
			const postTypeEntity = select( coreStore ).getPostType( postType );
			// `icon` is the `menu_icon` property of a post type. We
			// only handle `dashicons` for now, even if the `menu_icon`
			// also supports urls and svg as values.
			if (
				typeof postTypeEntity?.icon === 'string' &&
				postTypeEntity.icon.startsWith( 'dashicons-' )
			) {
				return postTypeEntity.icon.slice( 10 );
			}
			return pageIcon;
		}
	}
);

/**
 * Returns true if there are unsaved changes to the
 * post's meta fields, and false otherwise.
 *
 * @param {Object} state    Global application state.
 * @param {string} postType The post type of the post.
 * @param {number} postId   The ID of the post.
 *
 * @return {boolean} Whether there are edits or not in the meta fields of the relevant post.
 */
export const hasPostMetaChanges = createRegistrySelector(
	( select ) => ( state, postType, postId ) => {
		const { type: currentPostType, id: currentPostId } =
			getCurrentPost( state );
		// If no postType or postId is passed, use the current post.
		const edits = select( coreStore ).getEntityRecordNonTransientEdits(
			'postType',
			postType || currentPostType,
			postId || currentPostId
		);

		if ( ! edits?.meta ) {
			return false;
		}

		// Compare if anything apart from `footnotes` has changed.
		const originalPostMeta = select( coreStore ).getEntityRecord(
			'postType',
			postType || currentPostType,
			postId || currentPostId
		)?.meta;

		return ! fastDeepEqual(
			{ ...originalPostMeta, footnotes: undefined },
			{ ...edits.meta, footnotes: undefined }
		);
	}
);

export function getEntityActions( state, ...args ) {
	return _getEntityActions( state.dataviews, ...args );
}

export function isEntityReady( state, ...args ) {
	return _isEntityReady( state.dataviews, ...args );
}

export function getEntityFields( state, ...args ) {
	return _getEntityFields( state.dataviews, ...args );
}

/**
 * Similar to getBlocksByName in @wordpress/block-editor, but only returns the top-most
 * blocks that aren't descendants of the query block.
 *
 * @param {Object}       state      Global application state.
 * @param {Array|string} blockNames Block names of the blocks to retrieve.
 *
 * @return {Array} Block client IDs.
 */
export const getPostBlocksByName = createRegistrySelector( ( select ) =>
	createSelector(
		( state, blockNames ) => {
			blockNames = Array.isArray( blockNames )
				? blockNames
				: [ blockNames ];
			const { getBlocksByName, getBlockParents, getBlockName } =
				select( blockEditorStore );
			return getBlocksByName( blockNames ).filter( ( clientId ) =>
				getBlockParents( clientId ).every( ( parentClientId ) => {
					const parentBlockName = getBlockName( parentClientId );
					return (
						// Ignore descendents of the query block.
						parentBlockName !== 'core/query' &&
						// Enable only the top-most block.
						! blockNames.includes( parentBlockName )
					);
				} )
			);
		},
		() => [ select( blockEditorStore ).getBlocks() ]
	)
);

/**
 * Returns the default rendering mode for a post type by user preference or post type configuration.
 *
 * @param {Object} state    Global application state.
 * @param {string} postType The post type.
 *
 * @return {string} The default rendering mode. Returns `undefined` while resolving value.
 */
export const getDefaultRenderingMode = createRegistrySelector(
	( select ) => ( state, postType ) => {
		const { getPostType, getCurrentTheme, hasFinishedResolution } =
			select( coreStore );

		// This needs to be called before `hasFinishedResolution`.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const currentTheme = getCurrentTheme();
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const postTypeEntity = getPostType( postType );

		// Wait for the post type and theme resolution.
		if (
			! hasFinishedResolution( 'getPostType', [ postType ] ) ||
			! hasFinishedResolution( 'getCurrentTheme' )
		) {
			return undefined;
		}

		const theme = currentTheme?.stylesheet;
		const defaultModePreference = select( preferencesStore ).get(
			'core',
			'renderingModes'
		)?.[ theme ]?.[ postType ];
		const postTypeDefaultMode = Array.isArray(
			postTypeEntity?.supports?.editor
		)
			? postTypeEntity.supports.editor.find(
					( features ) => 'default-mode' in features
			  )?.[ 'default-mode' ]
			: undefined;

		const defaultMode = defaultModePreference || postTypeDefaultMode;

		// Fallback gracefully to 'post-only' when rendering mode is not supported.
		if ( ! RENDERING_MODES.includes( defaultMode ) ) {
			return 'post-only';
		}

		return defaultMode;
	}
);

/**
 * Get the current global styles navigation path.
 *
 * @param {Object} state Global application state.
 * @return {string} The current styles path.
 */
export function getStylesPath( state ) {
	return state.stylesPath ?? '/';
}

/**
 * Get whether the stylebook is currently visible.
 *
 * @param {Object} state Global application state.
 * @return {boolean} Whether the stylebook is visible.
 */
export function getShowStylebook( state ) {
	return state.showStylebook ?? false;
}
