import { useNavigate, useSearch } from '@wordpress/route';
import type { Action, View, SupportedLayouts } from '@wordpress/dataviews';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { useMemo, useCallback, useState } from '@wordpress/element';
import type { Post } from '@wordpress/core-data';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useView, useViewConfig } from '@wordpress/views';
import { DataViews } from '@wordpress/dataviews';
import { Button } from '@wordpress/components';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '@wordpress/routes-lock-unlock';
import { getActiveViewOverrides, type ViewOverrides } from './view-utils';
import { useEditNavigationAction } from './actions/edit-navigation';
import { AddNavigationModal } from './add-navigation';
import './style.scss';

// Unlock WordPress private APIs
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { usePostActions, usePostFields } = unlock( editorPrivateApis );

const NAVIGATION_POST_TYPE = 'wp_navigation';

const PRELOADED_NAVIGATION_MENUS_QUERY = {
	per_page: 100,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

function getItemId( item: Post ) {
	return item.id.toString();
}

function NavigationList() {
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/navigation/list' } );

	const {
		default_view: defaultView,
		default_layouts: defaultLayouts,
		view_list: viewList,
	} = useViewConfig( {
		kind: 'postType',
		name: NAVIGATION_POST_TYPE,
	} );
	const activeViewOverrides = useMemo(
		() => getActiveViewOverrides( viewList, 'all' ),
		[ viewList ]
	);

	if ( ! defaultView ) {
		// The route loader resolves the view configuration before the stage
		// mounts, so this only guards against the store being reset.
		return null;
	}

	return (
		<NavigationListView
			defaultView={ defaultView }
			defaultLayouts={ defaultLayouts }
			activeViewOverrides={ activeViewOverrides }
			navigate={ navigate }
			searchParams={ searchParams }
		/>
	);
}

function NavigationListView( {
	defaultView,
	defaultLayouts,
	activeViewOverrides,
	navigate,
	searchParams,
}: {
	defaultView: View;
	defaultLayouts: SupportedLayouts | undefined;
	activeViewOverrides: ViewOverrides;
	navigate: ReturnType< typeof useNavigate >;
	searchParams: ReturnType< typeof useSearch >;
} ) {
	const handleQueryParamsChange = useCallback(
		( params: { page?: number; search?: string } ) => {
			navigate( {
				search: {
					...searchParams,
					...params,
				},
			} );
		},
		[ searchParams, navigate ]
	);

	const { view, updateView, isModified, resetToDefault } = useView( {
		kind: 'postType',
		name: NAVIGATION_POST_TYPE,
		slug: 'default-new',
		defaultView,
		defaultLayouts,
		activeViewOverrides,
		queryParams: searchParams,
		onChangeQueryParams: handleQueryParamsChange,
	} );

	const {
		records: navigationMenus,
		totalItems,
		totalPages,
		isResolving,
	} = useEntityRecordsWithPermissions(
		'postType',
		NAVIGATION_POST_TYPE,
		PRELOADED_NAVIGATION_MENUS_QUERY
	);

	const fields = usePostFields( {
		postType: NAVIGATION_POST_TYPE,
	} );
	const [ showAddModal, setShowAddModal ] = useState( false );

	const editAction = useEditNavigationAction();
	const postTypeActions: Action< Post >[] = usePostActions( {
		postType: NAVIGATION_POST_TYPE,
		context: 'list',
	} );

	const actions: Action< Post >[] = useMemo( () => {
		return [
			editAction,
			...( postTypeActions?.flatMap< Action< Post > >( ( action ) => {
				switch ( action.id ) {
					// Skip revisions as Gutenberg does not support it in this context
					case 'view-post-revisions':
						return [];
				}
				return [ action ];
			} ) ?? [] ),
		];
	}, [ editAction, postTypeActions ] );

	const selection =
		( searchParams.ids ?? [] ).map( ( id: number ) => id.toString() ) ?? [];

	// Get the first navigation from the canvas loader if no selection
	const firstNavigationId = useMemo( () => {
		if ( navigationMenus && navigationMenus.length > 0 ) {
			return navigationMenus[ 0 ].id.toString();
		}
		return null;
	}, [ navigationMenus ] );

	if ( selection.length === 0 && firstNavigationId ) {
		selection.push( firstNavigationId );
	}

	if ( view.type === 'list' ) {
		selection.splice( 1 );
	}

	return (
		<>
			<Page
				title={ __( 'Navigation' ) }
				headingLevel={ 2 }
				className="navigation-page"
				hasPadding={ false }
				actions={
					<Button
						variant="primary"
						size="compact"
						onClick={ () => setShowAddModal( true ) }
					>
						{ __( 'Add New' ) }
					</Button>
				}
			>
				<DataViews
					data={ navigationMenus }
					fields={ fields }
					view={ view }
					onChangeView={ updateView }
					isLoading={ isResolving || ! fields }
					actions={ actions }
					paginationInfo={ {
						totalItems,
						totalPages,
					} }
					defaultLayouts={ defaultLayouts }
					getItemId={ getItemId }
					selection={ selection }
					onReset={ isModified ? resetToDefault : false }
					onChangeSelection={ ( items: string[] ) => {
						navigate( {
							search: {
								...searchParams,
								ids:
									items.length > 0
										? items.map( ( id ) => Number( id ) )
										: undefined,
							},
						} );
					} }
				/>
			</Page>
			{ showAddModal && (
				<AddNavigationModal
					closeModal={ () => setShowAddModal( false ) }
				/>
			) }
		</>
	);
}

export const stage = NavigationList;
