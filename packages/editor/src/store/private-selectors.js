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
import {
	getRenderingMode,
	getCurrentPost,
	getCurrentPostType,
	getCurrentPostId,
	getEditorSettings,
	getCurrentPostRevisionsCount,
} from './selectors';
import {
	getEntityActions as _getEntityActions,
	getEntityFields as _getEntityFields,
	isEntityReady as _isEntityReady,
} from '../dataviews/store/private-selectors';
import { getTemplatePartIcon } from '../utils';
import { unlock } from '../lock-unlock';

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
				const {
					getBlocksByName,
					getSelectedBlockClientId,
					getBlockParents,
					getBlockOrder,
				} = select( blockEditorStore );
				const [ postContentClientId ] =
					getBlocksByName( 'core/post-content' );
				if ( postContentClientId ) {
					const selectedBlockClientId = getSelectedBlockClientId();

					// If a block inside Post Content is selected,
					// let the inserter use its default logic for determining the
					// insertion position by returning an empty insertion point.
					if (
						selectedBlockClientId &&
						selectedBlockClientId !== postContentClientId &&
						getBlockParents( selectedBlockClientId ).includes(
							postContentClientId
						)
					) {
						return EMPTY_INSERTION_POINT;
					}

					// Otherwise (no selection, or Post Content itself
					// is selected), insert at the end of Post Content.
					return {
						rootClientId: postContentClientId,
						insertionIndex:
							getBlockOrder( postContentClientId ).length,
						filterValue: undefined,
					};
				}
			}

			return EMPTY_INSERTION_POINT;
		},
		( state ) => {
			const {
				getBlocksByName,
				getSelectedBlockClientId,
				getBlockParents,
				getBlockOrder,
			} = select( blockEditorStore );
			const [ postContentClientId ] =
				getBlocksByName( 'core/post-content' );
			const selectedBlockClientId = getSelectedBlockClientId();
			return [
				state.blockInserterPanel,
				getRenderingMode( state ),
				postContentClientId,
				selectedBlockClientId,
				selectedBlockClientId
					? getBlockParents( selectedBlockClientId )
					: undefined,
				postContentClientId
					? getBlockOrder( postContentClientId ).length
					: undefined,
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
		( state, blockNames ) => {
			blockNames = Array.isArray( blockNames )
				? blockNames
				: [ blockNames ];
			const { getBlocksByName, getBlockParents } =
				select( blockEditorStore );
			const clientIds = getBlocksByName( blockNames );
			const parentsOfClientIds = clientIds.map( ( id ) =>
				getBlockParents( id )
			);
			return [ clientIds, ...parentsOfClientIds ];
		}
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

		if ( RENDERING_MODES.includes( defaultModePreference ) ) {
			return defaultModePreference;
		}

		const postTypeDefaultMode = Array.isArray(
			postTypeEntity?.supports?.editor
		)
			? postTypeEntity.supports.editor.find(
					( features ) => 'default-mode' in features
			  )?.[ 'default-mode' ]
			: undefined;

		if ( RENDERING_MODES.includes( postTypeDefaultMode ) ) {
			return postTypeDefaultMode;
		}

		const settingsDefaultMode =
			getEditorSettings( state ).defaultRenderingMode;

		if ( RENDERING_MODES.includes( settingsDefaultMode ) ) {
			return settingsDefaultMode;
		}

		return 'post-only';
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

/**
 * Returns the current revisions page number.
 *
 * @param {Object} state Global application state.
 * @return {number} The page number.
 */
export function getRevisionPage( state ) {
	return state.revisionPage;
}

/**
 * Builds the query object for fetching a page of revisions.
 *
 * @param {string} revisionKey The entity's revision key.
 * @param {number} page        The 1-based page number (page 1 = newest).
 * @return {Object} Query object for getRevisions.
 */
export function buildRevisionsPageQuery( revisionKey, page ) {
	return {
		per_page: REVISIONS_PER_PAGE,
		page,
		context: 'edit',
		orderby: 'date',
		order: 'desc',
		_fields: [
			...new Set( [
				'id',
				'date',
				'modified',
				'author',
				'meta',
				'title.raw',
				'excerpt.raw',
				'content.raw',
				revisionKey,
			] ),
		].join(),
	};
}

const REVISIONS_PER_PAGE = 100;

export function getRevisionsPerPage() {
	return REVISIONS_PER_PAGE;
}

/**
 * Returns revisions for the given page number.
 *
 * @param {Object} state Global application state.
 * @param {number} page  The 1-based page number (page 1 = newest).
 * @return {Array|null} The revisions array, or null if not yet loaded.
 */
export const getPageRevisions = createRegistrySelector(
	( select ) => ( state, page ) => {
		if ( ! page ) {
			return null;
		}

		const { type: postType, id: postId } = getCurrentPost( state );
		if ( ! postType || ! postId ) {
			return null;
		}

		const entityConfig = select( coreStore ).getEntityConfig(
			'postType',
			postType
		);
		const revisionKey = entityConfig?.revisionKey || 'id';

		return select( coreStore ).getRevisions(
			'postType',
			postType,
			postId,
			buildRevisionsPageQuery( revisionKey, page )
		);
	}
);

/**
 * Returns whether the editor is in revisions preview mode.
 *
 * @param {Object} state Global application state.
 * @return {boolean} Whether revisions mode is active.
 */
export function isRevisionsMode( state ) {
	return state.revisionId !== null;
}

/**
 * Returns whether the revision diff highlighting is shown.
 *
 * @param {Object} state Global application state.
 * @return {boolean} Whether revision diff is being shown.
 */
export function isShowingRevisionDiff( state ) {
	return state.showRevisionDiff;
}

/**
 * Returns the current revision ID in revisions mode.
 *
 * @param {Object} state Global application state.
 * @return {number|null} The revision ID, or null if not in revisions mode.
 */
export function getCurrentRevisionId( state ) {
	return state.revisionId;
}

/**
 * Returns the current revision object in revisions mode.
 *
 * @param {Object} state Global application state.
 * @return {Object|null|undefined} The revision object, null if loading, or undefined if not in revisions mode.
 */
export const getCurrentRevision = createRegistrySelector(
	( select ) => ( state ) => {
		const revisionId = getCurrentRevisionId( state );
		if ( ! revisionId ) {
			return undefined;
		}

		const page = getRevisionPage( state );
		if ( ! page ) {
			return null;
		}

		const { type: postType, id: postId } = getCurrentPost( state );
		const entityConfig = select( coreStore ).getEntityConfig(
			'postType',
			postType
		);
		const revisionKey = entityConfig?.revisionKey || 'id';
		const revisions = select( coreStore ).getRevisions(
			'postType',
			postType,
			postId,
			buildRevisionsPageQuery( revisionKey, page )
		);
		if ( ! revisions ) {
			return null;
		}
		return (
			revisions.find( ( r ) => r[ revisionKey ] === revisionId ) ?? null
		);
	}
);

/**
 * Returns the currently selected note ID.
 *
 * @param {Object} state Global application state.
 *
 * @return {undefined|number|'new'} The selected note ID, 'new' for the new note form, or undefined if none.
 */
export function getSelectedNote( state ) {
	return state.selectedNote?.noteId;
}

/**
 * Returns whether the selected note should be focused.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the selected note should be focused.
 */
export function isNoteFocused( state ) {
	return !! state.selectedNote?.options?.focus;
}

/**
 * Returns the previous revision (the one before the current revision).
 * Used for diffing between revisions.
 *
 * @param {Object} state Global application state.
 * @return {Object|null|undefined} The previous revision object, null if loading or no previous revision, or undefined if not in revisions mode.
 */
export const getPreviousRevision = createRegistrySelector(
	( select ) => ( state ) => {
		const currentRevisionId = getCurrentRevisionId( state );
		if ( ! currentRevisionId ) {
			return undefined;
		}

		const page = getRevisionPage( state );
		if ( ! page ) {
			return null;
		}

		const { type: postType, id: postId } = getCurrentPost( state );
		const entityConfig = select( coreStore ).getEntityConfig(
			'postType',
			postType
		);
		const revisionKey = entityConfig?.revisionKey || 'id';
		const query = buildRevisionsPageQuery( revisionKey, page );
		const revisions = select( coreStore ).getRevisions(
			'postType',
			postType,
			postId,
			query
		);
		if ( ! revisions ) {
			return null;
		}

		// Find current revision index.
		const currentIndex = revisions.findIndex(
			( r ) => r[ revisionKey ] === currentRevisionId
		);

		// Return the previous revision (older one) if it exists.
		if ( currentIndex >= 0 && currentIndex < revisions.length - 1 ) {
			return revisions[ currentIndex + 1 ];
		}

		// At page boundary: fetch the first revision from the next page.
		const totalRevisions = getCurrentPostRevisionsCount( state );
		const totalPages = Math.ceil( totalRevisions / query.per_page ) || 1;
		if ( currentIndex === revisions.length - 1 && page < totalPages ) {
			const nextPageRevisions = select( coreStore ).getRevisions(
				'postType',
				postType,
				postId,
				buildRevisionsPageQuery( revisionKey, page + 1 )
			);
			return nextPageRevisions?.[ 0 ] ?? null;
		}

		return null;
	}
);

/**
 * Returns whether the collaboration is enabled for the current post.
 *
 * @return {boolean} Whether collaboration is enabled.
 */
export const isCollaborationEnabledForCurrentPost = createRegistrySelector(
	( select ) => ( state ) => {
		// Return early, if collaboration is not supported.
		if ( ! unlock( select( coreStore ) ).isCollaborationSupported() ) {
			return false;
		}

		const currentPostType = getCurrentPostType( state );
		const currentPostId = getCurrentPostId( state );
		const entityConfig = select( coreStore ).getEntityConfig(
			'postType',
			currentPostType
		);
		const syncConfig = entityConfig?.syncConfig;

		return Boolean(
			syncConfig &&
				syncConfig.supportsPersistence &&
				window._wpCollaborationEnabled &&
				false !==
					syncConfig.shouldSync?.(
						`postType/${ currentPostType }`,
						currentPostId
					)
		);
	}
);
