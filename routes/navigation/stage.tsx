/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import type {
	View,
	Action,
	ActionModal as ActionModalType,
} from '@wordpress/dataviews';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { useMemo, useCallback, useState } from '@wordpress/element';
import type { Post } from '@wordpress/core-data';
import { Page } from '@wordpress/admin-ui';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useView } from '@wordpress/views';
import { DataViews } from '@wordpress/dataviews';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { moreVertical } from '@wordpress/icons';
import { useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { getDefaultView } from './view-utils';
import { useEditNavigationAction } from './actions/edit-navigation';
import { AddNavigationModal } from './add-navigation';
import useNavigationStatus from './use-navigation-status';
import NavigationMenuEditor from './editor';

/**
 * Style dependencies
 */
import './style.scss';

// Unlock WordPress private APIs
const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );
const { usePostActions, usePostFields } = unlock( editorPrivateApis );
const { Menu } = unlock( componentsPrivateApis );

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

/**
 * Renders a kebab menu for a navigation menu item with Trash, Duplicate, and Rename actions.
 *
 * @param {Object}   root0                   Component props.
 * @param {Post}     root0.item              The navigation menu post.
 * @param {Action[]} root0.actions           Available actions.
 * @param {Function} root0.onActionPerformed Callback after an action completes.
 */
function NavigationMenuActions( {
	item,
	actions,
	onActionPerformed,
}: {
	item: Post;
	actions: Action< Post >[];
	onActionPerformed: (
		action: ActionModalType< Post >,
		items: Post[]
	) => void;
} ) {
	const registry = useRegistry();
	const [ activeModalAction, setActiveModalAction ] =
		useState< ActionModalType< Post > | null >( null );

	const eligibleActions = useMemo( () => {
		return actions.filter(
			( action ) =>
				// Skip the edit action — we're already in an edit context.
				action.id !== 'edit' &&
				// Skip revisions.
				action.id !== 'view-post-revisions' &&
				( ! action.isEligible || action.isEligible( item ) )
		);
	}, [ actions, item ] );

	if ( ! eligibleActions.length ) {
		return null;
	}

	return (
		<>
			<Menu placement="bottom-end">
				<Menu.TriggerButton
					render={
						<Button
							size="small"
							icon={ moreVertical }
							label={ __( 'Actions' ) }
							className="navigation-breadcrumbs__actions"
						/>
					}
				/>
				<Menu.Popover>
					<Menu.Group>
						{ eligibleActions.map( ( action ) => {
							const label =
								typeof action.label === 'string'
									? action.label
									: action.label( [ item ] );
							return (
								<Menu.Item
									key={ action.id }
									disabled={ action.disabled }
									onClick={ () => {
										if ( 'RenderModal' in action ) {
											setActiveModalAction(
												action as ActionModalType< Post >
											);
											return;
										}
										action.callback( [ item ], {
											registry,
										} );
									} }
								>
									<Menu.ItemLabel>{ label }</Menu.ItemLabel>
								</Menu.Item>
							);
						} ) }
					</Menu.Group>
				</Menu.Popover>
			</Menu>
			{ !! activeModalAction && (
				<Modal
					title={
						typeof activeModalAction.modalHeader === 'function'
							? activeModalAction.modalHeader( [ item ] )
							: activeModalAction.modalHeader ||
							  ( typeof activeModalAction.label === 'string'
									? activeModalAction.label
									: activeModalAction.label( [ item ] ) )
					}
					__experimentalHideHeader={
						!! activeModalAction.hideModalHeader
					}
					onRequestClose={ () => setActiveModalAction( null ) }
					focusOnMount={ activeModalAction.modalFocusOnMount ?? true }
					size={ activeModalAction.modalSize || 'medium' }
				>
					<activeModalAction.RenderModal
						items={ [ item ] }
						closeModal={ () => setActiveModalAction( null ) }
						onActionPerformed={ ( items: Post[] ) => {
							onActionPerformed( activeModalAction, items );
						} }
					/>
				</Modal>
			) }
		</>
	);
}

function NavigationList() {
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/navigation' } );

	const editId = ( searchParams as any ).editId as number | undefined;

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

	const baseFields = usePostFields( {
		postType: NAVIGATION_POST_TYPE,
	} );

	const { statusMap, isResolving: isResolvingStatus } = useNavigationStatus();

	const fields = useMemo( () => {
		if ( ! baseFields ) {
			return baseFields;
		}

		return baseFields.map( ( field: any ) => {
			// Add badges to the title field
			if ( field.id === 'title' ) {
				return {
					...field,
					render: ( props: any ) => {
						const originalRender = field.render
							? field.render( props )
							: props.item.title?.rendered || '';

						const count = statusMap[ props.item.id ] || 0;
						const isActive = count > 0;
						const statusText = isActive
							? sprintf(
									/* translators: %d: number of template part locations */
									_n( '%d location', '%d locations', count ),
									count
							  )
							: __( 'Inactive' );

						return (
							<>
								{ originalRender }
								<span className="navigation-list__item-status">
									{ statusText }
								</span>
							</>
						);
					},
				};
			}
			return field;
		} );
	}, [ baseFields, statusMap ] );

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

	// Show the editor inline when editId is set in the URL.
	if ( editId ) {
		const navigationMenu = ( navigationMenus as Post[] | undefined )?.find(
			( m ) => m.id === editId
		);
		const menuTitle = decodeEntities(
			( navigationMenu as any )?.title?.rendered ||
				( navigationMenu as any )?.title?.raw ||
				''
		);

		return (
			<Page
				title={
					<HStack
						spacing={ 1 }
						alignment="left"
						className="navigation-breadcrumbs"
					>
						<button
							type="button"
							className="navigation-breadcrumbs__link"
							onClick={ () =>
								navigate( {
									search: {
										...searchParams,
										editId: undefined,
									},
								} )
							}
						>
							{ __( 'Navigation' ) }
						</button>
						<span className="navigation-breadcrumbs__separator">
							/
						</span>
						<span className="navigation-breadcrumbs__current">
							{ menuTitle }
						</span>
						{ navigationMenu && (
							<NavigationMenuActions
								item={ navigationMenu }
								actions={ actions }
								onActionPerformed={ ( action, items ) => {
									if ( action.id === 'move-to-trash' ) {
										navigate( {
											search: {
												...searchParams,
												editId: undefined,
											},
										} );
									} else if (
										action.id === 'duplicate-post'
									) {
										navigate( {
											search: {
												...searchParams,
												editId: items[ 0 ]?.id,
											},
										} );
									}
								} }
							/>
						) }
					</HStack>
				}
				hasPadding
			>
				<NavigationMenuEditor id={ editId } />
			</Page>
		);
	}

	const selection =
		( searchParams.ids ?? [] ).map( ( id: number ) => id.toString() ) ?? [];

	if ( view.type === 'list' ) {
		selection.splice( 1 );
	}

	return (
		<>
			<Page
				title={ __( 'Navigation' ) }
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
					isLoading={ isResolving || isResolvingStatus || ! fields }
					actions={ actions }
					paginationInfo={ {
						totalItems,
						totalPages,
					} }
					defaultLayouts={ {
						list: {},
					} }
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
