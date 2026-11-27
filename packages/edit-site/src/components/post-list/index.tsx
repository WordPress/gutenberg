import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import type { Post } from '@wordpress/core-data';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import type { View } from '@wordpress/dataviews';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useEvent, usePrevious } from '@wordpress/compose';
import { addQueryArgs } from '@wordpress/url';
import { useView, useViewConfig } from '@wordpress/views';
import {
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_BEFORE,
	OPERATOR_AFTER,
	LAYOUT_LIST,
} from '../../utils/constants';
import AddNewPostModal from '../add-new-post';
import { unlock } from '../../lock-unlock';
import {
	useEditPostAction,
	useQuickEditPostAction,
} from '../dataviews-actions';
import useNotesCount from './use-notes-count';
import { QuickEditModal } from './quick-edit-modal';

const { usePostActions, usePostFields } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
/**
 * A post as listed, with the hierarchy level the REST API adds when ordering
 * by hierarchy and the number of notes left on it, unset until that arrives.
 */
type PostListItem = Post & {
	level?: number;
	notesCount?: number;
};

const EMPTY_ARRAY: PostListItem[] = [];
const EMPTY_IDS: number[] = [];

const NOTES_COUNT_FIELD = 'notesCount';

const DEFAULT_STATUSES = 'draft,future,pending,private,publish'; // All but 'trash'.

function getItemId( item: Post ) {
	return item.id.toString();
}

function getItemLevel( item: PostListItem ) {
	return item.level as number;
}

export default function PostList( { postType }: { postType: string } ) {
	const { path, query } = useLocation();
	const { activeView = 'all', postId, quickEdit = false } = query;
	const history = useHistory();
	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
		form: quickEditForm,
	} = useViewConfig( {
		kind: 'postType',
		name: postType,
	} );
	const activeViewOverrides = useMemo(
		() => viewList?.find( ( v ) => v.slug === activeView )?.view ?? {},
		[ viewList, activeView ]
	);
	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: postType,
		slug: 'default',
		// The route resolves the view config before the list renders.
		defaultView: defaultView as View,
		defaultLayouts,
		activeViewOverrides,
		queryParams: {
			page: query.pageNumber,
			search: query.search,
		},
		onChangeQueryParams: ( newQueryParams: {
			page?: number;
			search?: string;
		} ) => {
			history.navigate(
				addQueryArgs( path, {
					...query,
					pageNumber: newQueryParams.page,
					search: newQueryParams.search || undefined,
				} )
			);
		},
	} );

	const onChangeView = useEvent( ( newView: View ) => {
		updateView( newView );
		if ( newView.type !== view.type ) {
			// Retrigger the routing areas resolution.
			history.invalidate();
		}
	} );

	const [ selection, setSelection ] = useState< string[] >(
		postId?.split( ',' ) ?? []
	);
	const onChangeSelection = useCallback(
		( items: string[] ) => {
			setSelection( items );
			history.navigate(
				addQueryArgs( path, {
					postId: items.join( ',' ),
				} )
			);
		},
		[ path, history ]
	);
	useEffect( () => {
		const newSelection = postId?.split( ',' ) ?? [];
		setSelection( newSelection );
	}, [ postId ] );

	const fields = usePostFields( {
		postType,
	} );

	const queryArgs = useMemo( () => {
		const filters: Record< string, any > = {};
		view.filters?.forEach( ( filter ) => {
			if (
				filter.field === 'status' &&
				filter.operator === OPERATOR_IS_ANY
			) {
				filters.status = filter.value;
			}
			if (
				filter.field === 'author' &&
				filter.operator === OPERATOR_IS_ANY
			) {
				filters.author = filter.value;
			} else if (
				filter.field === 'author' &&
				filter.operator === OPERATOR_IS_NONE
			) {
				filters.author_exclude = filter.value;
			}
			if ( filter.field === 'date' ) {
				// Skip if no value is set yet
				if ( ! filter.value ) {
					return;
				}
				if ( filter.operator === OPERATOR_BEFORE ) {
					filters.before = filter.value;
				} else if ( filter.operator === OPERATOR_AFTER ) {
					filters.after = filter.value;
				}
			}
		} );

		// We want to provide a different default item for the status filter
		// than the REST API provides.
		if ( ! filters.status || filters.status === '' ) {
			filters.status = DEFAULT_STATUSES;
		}

		return {
			per_page: view.perPage,
			page: view.page,
			_embed: 'author,wp:featuredmedia',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			orderby_hierarchy: !! view.showLevels,
			search: view.search,
			...filters,
		};
	}, [ view ] );
	const {
		records,
		isResolving: isLoadingData,
		totalItems,
		totalPages,
		hasResolved,
	} = useEntityRecordsWithPermissions( 'postType', postType, queryArgs );

	const postIds = useMemo(
		() => records?.map( ( record: Post ) => record.id ) ?? [],
		[ records ]
	);
	// The notes field exists only for post types that support notes.
	const hasNotesField = fields.some(
		( field: { id: string } ) => field.id === NOTES_COUNT_FIELD
	);
	// Fetch the counts even when the field is hidden, since actions get them
	// with the posts, but only wait for them when the field is shown.
	const { notesCount, isLoading: isLoadingNotesCount } = useNotesCount(
		hasNotesField ? postIds : EMPTY_IDS
	);
	const showsNotesCount =
		hasNotesField &&
		( !! view.fields?.includes( NOTES_COUNT_FIELD ) ||
			( view.titleField === NOTES_COUNT_FIELD &&
				view.showTitle !== false ) ||
			( view.mediaField === NOTES_COUNT_FIELD &&
				view.showMedia !== false ) ||
			( view.descriptionField === NOTES_COUNT_FIELD &&
				view.showDescription !== false ) ||
			view.groupBy?.field === NOTES_COUNT_FIELD );

	const data = useMemo(
		(): PostListItem[] | undefined =>
			records?.map( ( record: Post ) => ( {
				...record,
				notesCount: notesCount[ record.id ],
			} ) ),
		[ records, notesCount ]
	);

	const ids = data?.map( ( record ) => getItemId( record ) ) ?? [];
	const prevIds = usePrevious( ids ) ?? [];
	const deletedIds = prevIds.filter( ( id ) => ! ids.includes( id ) );
	const postIdWasDeleted = deletedIds.includes( postId );

	useEffect( () => {
		if ( postIdWasDeleted ) {
			history.navigate(
				addQueryArgs( path, {
					postId: undefined,
				} )
			);
		}
	}, [ history, postIdWasDeleted, path ] );

	const paginationInfo = useMemo(
		() => ( {
			totalItems,
			totalPages,
		} ),
		[ totalItems, totalPages ]
	);

	const { labels, canCreateRecord } = useSelect(
		( select ) => {
			const { getPostType, canUser } = select( coreStore );
			return {
				labels: getPostType( postType )?.labels,
				canCreateRecord: canUser( 'create', {
					kind: 'postType',
					name: postType,
				} ),
			};
		},
		[ postType ]
	);

	// The sidebar counts come with the view config, which is cached per post
	// type. Fetching it again after a change updates the counts only: the
	// user's view lives in preferences, which this does not touch.
	const { invalidateResolution } = useDispatch( coreStore );
	const refreshViewCounts = useCallback( () => {
		invalidateResolution( 'getViewConfig', [ 'postType', postType ] );
	}, [ invalidateResolution, postType ] );

	// Leaving the list, such as to publish a draft in the editor, can change
	// the totals without any action here to report it. Marking the counts stale
	// on the way out fetches them again on the way back.
	useEffect( () => refreshViewCounts, [ refreshViewCounts ] );

	const postTypeActions = usePostActions( {
		postType,
		context: 'list',
		// Any action may change the totals, including a plugin's, so refresh
		// after each one rather than tracking which do.
		onActionPerformed: refreshViewCounts,
	} );
	const editAction = useEditPostAction();
	const quickEditAction = useQuickEditPostAction();
	const actions = useMemo( () => {
		if ( view.type === LAYOUT_LIST ) {
			const editActionPrimary = { ...editAction, isPrimary: true };
			return [ editActionPrimary, ...postTypeActions ];
		}

		return [ editAction, quickEditAction, ...postTypeActions ];
	}, [ view.type, editAction, quickEditAction, postTypeActions ] );

	const [ showAddPostModal, setShowAddPostModal ] = useState( false );

	const openModal = () => setShowAddPostModal( true );
	const closeModal = () => setShowAddPostModal( false );
	const handleNewPage = ( { type, id }: { type: string; id: number } ) => {
		history.navigate( `/${ type }/${ id }?canvas=edit` );
		closeModal();
	};
	const closeQuickEditModal = () => {
		history.navigate(
			addQueryArgs( path, {
				...query,
				quickEdit: undefined,
			} )
		);
	};

	return (
		<Page
			title={ labels?.name }
			headingLevel={ 2 }
			actions={
				<>
					{ labels?.add_new_item && canCreateRecord && (
						<>
							<Button
								variant="primary"
								onClick={ openModal }
								size="compact"
								__next40pxDefaultSize
							>
								{ labels.add_new_item }
							</Button>
							{ showAddPostModal && (
								<AddNewPostModal
									postType={ postType }
									onSave={ handleNewPage }
									onClose={ closeModal }
								/>
							) }
						</>
					) }
				</>
			}
		>
			<DataViews
				key={ activeView }
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ data || EMPTY_ARRAY }
				isLoading={
					isLoadingData ||
					! hasResolved ||
					( showsNotesCount && isLoadingNotesCount )
				}
				view={ view }
				onChangeView={ onChangeView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				isItemClickable={ ( item ) => item.status !== 'trash' }
				onClickItem={ ( { id } ) => {
					history.navigate( `/${ postType }/${ id }?canvas=edit` );
				} }
				getItemId={ getItemId }
				getItemLevel={ getItemLevel }
				defaultLayouts={ defaultLayouts }
				onReset={
					isModified
						? () => {
								resetToDefault();
								history.invalidate();
							}
						: false
				}
			/>
			{ quickEdit &&
				! isLoadingData &&
				selection.length > 0 &&
				view.type !== LAYOUT_LIST && (
					<QuickEditModal
						postType={ postType }
						postId={ selection }
						closeModal={ closeQuickEditModal }
						onSave={ refreshViewCounts }
						quickEditForm={ quickEditForm }
					/>
				) }
		</Page>
	);
}
