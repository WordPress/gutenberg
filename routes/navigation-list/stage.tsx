/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import type { View, Action } from '@wordpress/dataviews';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { useMemo, useCallback, useState } from '@wordpress/element';
import type { Post } from '@wordpress/core-data';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useView } from '@wordpress/views';
import { DataViews } from '@wordpress/dataviews';
import { Button } from '@wordpress/components';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '@wordpress/routes-lock-unlock';
import { navigation as navigationIcon } from '@wordpress/icons';
import { EmptyState } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { getDefaultView } from './view-utils';
import { useEditNavigationAction } from './actions/edit-navigation';
import { AddNavigationModal } from './add-navigation';
import useNavigationLocations from '../navigation/use-navigation-locations';
import { createLocationsField } from './fields/usage';

/**
 * Style dependencies
 */
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

	const defaultView: View = useMemo( () => {
		return getDefaultView();
	}, [] );

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
	const { locationsMap, isResolving: isResolvingLocations } =
		useNavigationLocations();
	const locationsField = useMemo(
		() =>
			createLocationsField( {
				locationsMap,
				isResolving: isResolvingLocations,
			} ),
		[ locationsMap, isResolvingLocations ]
	);
	const navigationFields = useMemo(
		() => ( fields ? [ ...fields, locationsField ] : fields ),
		[ fields, locationsField ]
	);
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
	const emptyState =
		! isResolving && totalItems === 0 ? (
			<EmptyState.Root>
				<EmptyState.Icon icon={ navigationIcon } />
				<EmptyState.Title>
					{ __( 'No navigation menus yet' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'Create your first menu to start adding links to your site navigation.'
					) }
				</EmptyState.Description>
				<EmptyState.Actions>
					<Button
						variant="primary"
						onClick={ () => setShowAddModal( true ) }
						__next40pxDefaultSize
					>
						{ __( 'Add your first menu' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		) : undefined;

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
					fields={ navigationFields }
					view={ view }
					onChangeView={ updateView }
					isLoading={ isResolving || ! navigationFields }
					actions={ actions }
					paginationInfo={ {
						totalItems,
						totalPages,
					} }
					defaultLayouts={ {
						list: true,
					} }
					empty={ emptyState }
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
