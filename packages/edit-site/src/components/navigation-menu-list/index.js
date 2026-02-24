/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { addQueryArgs } from '@wordpress/url';
import { useView } from '@wordpress/views';
import { useEvent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	OPERATOR_IS_ANY,
	OPERATOR_IS,
	LAYOUT_LIST,
	NAVIGATION_POST_TYPE,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import AddNewPostModal from '../add-new-post';
import useMenuIdsWithActiveLocations from '../../hooks/use-menu-ids-with-active-locations';

const { usePostActions, usePostFields } = unlock( editorPrivateApis );

const ACTIVE_FILTER_ELEMENTS = [
	{ value: 'active', label: __( 'Active' ) },
	{ value: 'inactive', label: __( 'Inactive' ) },
];

const activeField = {
	id: 'active',
	label: __( 'Active' ),
	getValue: () => '',
	filterBy: {
		operators: [ OPERATOR_IS ],
		isPrimary: true,
	},
	elements: ACTIVE_FILTER_ELEMENTS,
	enableSorting: false,
};
const { useLocation, useHistory } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const EMPTY_ARRAY = [];

const DEFAULT_STATUSES = 'draft,future,pending,private,publish';

const DEFAULT_VIEW = {
	type: LAYOUT_LIST,
	filters: [],
	sort: { field: 'date', direction: 'desc' },
	titleField: 'title',
	perPage: 100,
	fields: [ 'status' ],
};

const defaultLayouts = { list: {} };

const SLUG_TO_STATUS = {
	published: 'publish',
	drafts: 'draft',
	trash: 'trash',
};

const SLUG_TO_ACTIVE_FILTER = {
	active: 'active',
	inactive: 'inactive',
};

function getActiveViewOverridesForTab( activeView ) {
	const status = SLUG_TO_STATUS[ activeView ];
	if ( status ) {
		return {
			filters: [
				{
					field: 'status',
					operator: OPERATOR_IS_ANY,
					value: status,
					isLocked: true,
				},
			],
		};
	}
	const activeValue = SLUG_TO_ACTIVE_FILTER[ activeView ];
	if ( activeValue ) {
		return {
			filters: [
				{
					field: 'active',
					operator: OPERATOR_IS,
					value: activeValue,
					isLocked: true,
				},
			],
		};
	}
	return {};
}

function getItemId( item ) {
	return item.id.toString();
}

export default function NavigationMenuList() {
	const { path, query } = useLocation();
	const { activeView = 'all', postId } = query;
	const history = useHistory();
	const [ selection, setSelection ] = useState( postId ? [ postId ] : [] );

	const activeViewOverrides = useMemo(
		() => getActiveViewOverridesForTab( activeView ),
		[ activeView ]
	);

	const { view, updateView } = useView( {
		kind: 'postType',
		name: NAVIGATION_POST_TYPE,
		slug: 'navigation-menus',
		defaultView: DEFAULT_VIEW,
		activeViewOverrides,
		queryParams: {
			page: query?.pageNumber,
			search: query?.search,
		},
		onChangeQueryParams: ( newQueryParams ) => {
			history.navigate(
				addQueryArgs( path, {
					...query,
					pageNumber: newQueryParams.page,
					search: newQueryParams.search || undefined,
				} )
			);
		},
	} );

	const onChangeView = useEvent( ( newView ) => {
		updateView( newView );
		if ( newView.type !== view.type ) {
			history.invalidate();
		}
	} );

	const onChangeSelection = useCallback(
		( items ) => {
			setSelection( items );
			history.navigate(
				addQueryArgs( path, {
					postId: items[ 0 ] || undefined,
				} )
			);
		},
		[ path, history ]
	);

	useEffect( () => {
		setSelection( postId ? [ postId ] : [] );
	}, [ postId ] );

	const baseFields = usePostFields( { postType: NAVIGATION_POST_TYPE } );
	const fields = useMemo(
		() => ( baseFields ? [ activeField, ...baseFields ] : null ),
		[ baseFields ]
	);

	const { activeMenuIds, isResolving: isLoadingActiveIds } =
		useMenuIdsWithActiveLocations();

	const activeFilter = view.filters?.find(
		( f ) => f.field === 'active' && f.operator === OPERATOR_IS
	);
	const hasActiveFilter = !! activeFilter?.value;

	const queryArgs = useMemo( () => {
		const filters = {};
		view.filters?.forEach( ( filter ) => {
			if (
				filter.field === 'status' &&
				filter.operator === OPERATOR_IS_ANY
			) {
				filters.status = filter.value;
			}
		} );

		if ( ! filters.status || filters.status === '' ) {
			filters.status = DEFAULT_STATUSES;
		}

		return {
			per_page: hasActiveFilter ? -1 : view.perPage,
			page: hasActiveFilter ? 1 : view.page,
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			...filters,
		};
	}, [ view, hasActiveFilter ] );

	const {
		records,
		isResolving: isLoadingData,
		totalItems: apiTotalItems,
		totalPages: apiTotalPages,
	} = useEntityRecordsWithPermissions(
		'postType',
		NAVIGATION_POST_TYPE,
		queryArgs
	);

	const { data, paginationInfo } = useMemo( () => {
		let filtered = records ?? EMPTY_ARRAY;

		if ( hasActiveFilter ) {
			const isActive = activeFilter.value === 'active';
			filtered = filtered.filter( ( menu ) =>
				isActive
					? activeMenuIds.has( menu.id )
					: ! activeMenuIds.has( menu.id )
			);
		}

		if ( ! hasActiveFilter ) {
			return {
				data: filtered,
				paginationInfo: {
					totalItems: apiTotalItems ?? 0,
					totalPages: apiTotalPages ?? 0,
				},
			};
		}

		const totalItems = filtered.length;
		const totalPages = Math.max(
			1,
			Math.ceil( totalItems / view.perPage )
		);
		const page = Math.min( view.page, totalPages );
		const start = ( page - 1 ) * view.perPage;
		const paginatedData = filtered.slice( start, start + view.perPage );

		return {
			data: paginatedData,
			paginationInfo: { totalItems, totalPages },
		};
	}, [
		records,
		hasActiveFilter,
		activeFilter?.value,
		activeMenuIds,
		apiTotalItems,
		apiTotalPages,
		view.perPage,
		view.page,
	] );

	const { labels, canCreateRecord } = useSelect( ( select ) => {
		const { getPostType, canUser } = select( coreStore );
		return {
			labels: getPostType( NAVIGATION_POST_TYPE )?.labels,
			canCreateRecord: canUser( 'create', {
				kind: 'postType',
				name: NAVIGATION_POST_TYPE,
			} ),
		};
	}, [] );

	const postTypeActions = usePostActions( {
		postType: NAVIGATION_POST_TYPE,
		context: 'list',
	} );
	const historyForActions = useHistory();
	const editAction = useMemo(
		() => ( {
			id: 'edit-post',
			label: __( 'Edit' ),
			isPrimary: true,
			isEligible( post ) {
				return post.status !== 'trash';
			},
			callback( items ) {
				historyForActions.navigate( `/navigation/${ items[ 0 ].id }` );
			},
		} ),
		[ historyForActions ]
	);
	const actions = useMemo(
		() => [ editAction, ...postTypeActions ],
		[ editAction, postTypeActions ]
	);

	const [ showAddModal, setShowAddModal ] = useState( false );
	const openModal = () => setShowAddModal( true );
	const closeModal = () => setShowAddModal( false );
	const handleNewMenu = ( newMenu ) => {
		history.navigate( `/navigation/${ newMenu.id }` );
		closeModal();
	};

	return (
		<Page
			title={ labels?.name }
			actions={
				<>
					{ labels?.add_new_item && canCreateRecord && (
						<>
							<Button
								variant="primary"
								onClick={ openModal }
								__next40pxDefaultSize
							>
								{ labels.add_new_item }
							</Button>
							{ showAddModal && (
								<AddNewPostModal
									postType={ NAVIGATION_POST_TYPE }
									onSave={ handleNewMenu }
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
				data={ data }
				isLoading={
					isLoadingData ||
					( hasActiveFilter && isLoadingActiveIds ) ||
					! fields
				}
				view={ view }
				onChangeView={ onChangeView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				isItemClickable={ ( item ) => item.status !== 'trash' }
				onClickItem={ ( { id } ) => {
					onChangeSelection( [ id.toString() ] );
				} }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
			/>
		</Page>
	);
}
