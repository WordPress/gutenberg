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
	LAYOUT_LIST,
	NAVIGATION_POST_TYPE,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import AddNewPostModal from '../add-new-post';

const { usePostActions, usePostFields } = unlock( editorPrivateApis );
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

function getActiveViewOverridesForTab( activeView ) {
	const status = SLUG_TO_STATUS[ activeView ];
	if ( ! status ) {
		return {};
	}
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

	const fields = usePostFields( { postType: NAVIGATION_POST_TYPE } );

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
			per_page: view.perPage,
			page: view.page,
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			...filters,
		};
	}, [ view ] );

	const {
		records,
		isResolving: isLoadingData,
		totalItems,
		totalPages,
	} = useEntityRecordsWithPermissions(
		'postType',
		NAVIGATION_POST_TYPE,
		queryArgs
	);

	const data = records ?? EMPTY_ARRAY;
	const paginationInfo = useMemo(
		() => ( { totalItems: totalItems ?? 0, totalPages: totalPages ?? 0 } ),
		[ totalItems, totalPages ]
	);

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
				isLoading={ isLoadingData || ! fields }
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
