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

/**
 * Internal dependencies
 */
import { LAYOUT_LIST, NAVIGATION_POST_TYPE } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { PRELOADED_NAVIGATION_MENUS_QUERY } from '../sidebar-navigation-screen-navigation-menus/constants';
import AddNewPostModal from '../add-new-post';

const { usePostFields } = unlock( editorPrivateApis );
const { useLocation, useHistory } = unlock( routerPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const EMPTY_ARRAY = [];

const DEFAULT_VIEW = {
	type: LAYOUT_LIST,
	sort: { field: 'date', direction: 'desc' },
	titleField: 'title',
	perPage: 100,
};

const defaultLayouts = { list: {} };

function getItemId( item ) {
	return item.id.toString();
}

export default function NavigationMenuList() {
	const { path, query } = useLocation();
	const postId = query?.postId;
	const history = useHistory();
	const [ selection, setSelection ] = useState( postId ? [ postId ] : [] );

	const { view, updateView } = useView( {
		kind: 'postType',
		name: NAVIGATION_POST_TYPE,
		slug: 'navigation-menus',
		defaultView: DEFAULT_VIEW,
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

	const onChangeSelection = useCallback(
		( items ) => {
			setSelection( items );
			history.navigate(
				addQueryArgs( path, {
					...query,
					postId: items[ 0 ] || undefined,
				} )
			);
		},
		[ path, query, history ]
	);

	useEffect( () => {
		setSelection( postId ? [ postId ] : [] );
	}, [ postId ] );

	const fields = usePostFields( { postType: NAVIGATION_POST_TYPE } );

	const {
		records,
		isResolving: isLoadingData,
		totalItems,
		totalPages,
	} = useEntityRecordsWithPermissions(
		'postType',
		NAVIGATION_POST_TYPE,
		useMemo(
			() => ( {
				...PRELOADED_NAVIGATION_MENUS_QUERY,
				per_page: view.perPage,
				page: view.page,
				search: view.search,
				order: view.sort?.direction,
				orderby: view.sort?.field,
			} ),
			[ view.perPage, view.page, view.search, view.sort ]
		)
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

	const historyForActions = useHistory();
	const editAction = useMemo(
		() => ( {
			id: 'edit-post',
			label: __( 'Edit' ),
			isPrimary: true,
			callback( items ) {
				historyForActions.navigate( `/navigation/${ items[ 0 ].id }` );
			},
		} ),
		[ historyForActions ]
	);
	const [ showAddModal, setShowAddModal ] = useState( false );
	const openModal = () => setShowAddModal( true );
	const closeModal = () => setShowAddModal( false );
	const handleNewMenu = ( newMenu ) => {
		history.navigate( `/navigation/${ newMenu.id }` );
		closeModal();
	};

	// Default selection to first menu when none selected and we have data.
	const firstItemId = data[ 0 ]?.id;
	useEffect( () => {
		if ( selection.length === 0 && firstItemId && ! postId ) {
			history.navigate(
				addQueryArgs( path, { ...query, postId: firstItemId } )
			);
		}
	}, [ firstItemId, postId, selection.length, history, path, query ] );

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
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ [ { ...editAction, isPrimary: true } ] }
				data={ data }
				isLoading={ isLoadingData || ! fields }
				view={ view }
				onChangeView={ updateView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				isItemClickable={ () => true }
				onClickItem={ ( { id } ) => {
					history.navigate( `/navigation/${ id }` );
				} }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
			/>
		</Page>
	);
}
