/**
 * WordPress dependencies
 */
import { useNavigate, useSearch, Link } from '@wordpress/route';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Page } from '@wordpress/admin-ui';
import type {
	View,
	Field,
	Action,
	SupportedLayouts,
} from '@wordpress/dataviews';
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useMemo, useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

interface EntityConfig {
	slug: string;
	entity_type: 'post_type' | 'taxonomy';
	_user_created: boolean;
	_source: 'core' | 'plugin' | 'user';
	_orphaned: boolean;
	_customized: boolean;
	labels?: Record< string, string >;
	description?: string;
	public?: boolean;
	hierarchical?: boolean;
	show_in_rest?: boolean;
	show_ui?: boolean;
}

const DEFAULT_VIEW: View = {
	type: 'table' as const,
	search: '',
	sort: {
		field: 'slug',
		direction: 'asc' as const,
	},
	fields: [ 'slug', 'description', 'public', 'source' ],
	titleField: 'name',
};

const DEFAULT_LAYOUTS: SupportedLayouts = {
	table: true,
};

const TABS = [
	{ slug: 'post_type', label: __( 'Post Types' ) },
	{ slug: 'taxonomy', label: __( 'Taxonomies' ) },
];

const fields: Field< EntityConfig >[] = [
	{
		id: 'name',
		label: __( 'Name' ),
		enableGlobalSearch: true,
		enableHiding: false,
		render: ( { item }: { item: EntityConfig } ) => {
			return <>{ item.labels?.name || item.slug }</>;
		},
		getValue: ( { item }: { item: EntityConfig } ) => {
			return item.labels?.name || item.slug;
		},
	},
	{
		id: 'slug',
		label: __( 'Slug' ),
		enableGlobalSearch: true,
		getValue: ( { item }: { item: EntityConfig } ) => item.slug,
	},
	{
		id: 'description',
		label: __( 'Description' ),
		getValue: ( { item }: { item: EntityConfig } ) =>
			item.description || '',
		enableSorting: false,
	},
	{
		id: 'public',
		label: __( 'Public' ),
		render: ( { item }: { item: EntityConfig } ) => {
			return <>{ item.public ? __( 'Yes' ) : __( 'No' ) }</>;
		},
		getValue: ( { item }: { item: EntityConfig } ) =>
			item.public ? 'yes' : 'no',
		elements: [
			{ value: 'yes', label: __( 'Yes' ) },
			{ value: 'no', label: __( 'No' ) },
		],
		filterBy: {
			operators: [ 'is' as const ],
		},
	},
	{
		id: 'source',
		label: __( 'Source' ),
		render: ( { item }: { item: EntityConfig } ) => {
			if ( item._orphaned ) {
				return <>{ __( 'Orphaned' ) }</>;
			}
			switch ( item._source ) {
				case 'core':
					return <>{ __( 'Core' ) }</>;
				case 'user':
					return <>{ __( 'Custom' ) }</>;
				case 'plugin':
				default:
					return <>{ __( 'Plugin' ) }</>;
			}
		},
		getValue: ( { item }: { item: EntityConfig } ) => {
			if ( item._orphaned ) {
				return 'orphaned';
			}
			return item._source ?? 'plugin';
		},
		elements: [
			{ value: 'core', label: __( 'Core' ) },
			{ value: 'plugin', label: __( 'Plugin' ) },
			{ value: 'user', label: __( 'Custom' ) },
			{ value: 'orphaned', label: __( 'Orphaned' ) },
		],
		filterBy: {
			operators: [ 'is' as const ],
		},
	},
];

function getItemId( item: EntityConfig ) {
	return `${ item.entity_type }:${ item.slug }`;
}

function EntityList() {
	const navigate = useNavigate();
	const searchParams = useSearch( { from: '/' } );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	// Show a success notice if we just reloaded after a save.
	useEffect( () => {
		const message = sessionStorage.getItem( 'gutenberg_entity_saved' );
		if ( message ) {
			sessionStorage.removeItem( 'gutenberg_entity_saved' );
			createSuccessNotice( message, {
				type: 'snackbar',
				id: 'entity-save-success',
			} );
		}
	}, [ createSuccessNotice ] );

	const [ allConfigs, setAllConfigs ] = useState< EntityConfig[] >( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const initialTab =
		searchParams.tab === 'taxonomy' ? 'taxonomy' : 'post_type';
	const [ activeTab, setActiveTab ] = useState< string >( initialTab );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	// Fetch entity configs from REST API.
	useEffect( () => {
		setIsLoading( true );
		apiFetch< EntityConfig[] >( {
			path: '/gutenberg/v1/entity-configs',
		} )
			.then( ( response ) => {
				setAllConfigs( response );
				setIsLoading( false );
			} )
			.catch( () => {
				setIsLoading( false );
			} );
	}, [] );

	// Filter configs by the active tab.
	const filteredConfigs = useMemo( () => {
		return allConfigs.filter(
			( config ) => config.entity_type === activeTab
		);
	}, [ allConfigs, activeTab ] );

	// Apply client-side sorting, filtering, and pagination.
	const { data, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( filteredConfigs, view, fields );
	}, [ filteredConfigs, view ] );

	const handleTabChange = useCallback(
		( tab: string ) => {
			setActiveTab( tab );
			setView( DEFAULT_VIEW );
			navigate( { search: { tab } } );
		},
		[ navigate ]
	);

	const deleteAction: Action< EntityConfig > = useMemo(
		() => ( {
			id: 'delete',
			label: __( 'Delete' ),
			isPrimary: false,
			isEligible( item: EntityConfig ) {
				return item._user_created || item._orphaned;
			},
			callback( items: EntityConfig[] ) {
				const item = items[ 0 ];
				apiFetch( {
					path: `/gutenberg/v1/entity-configs/${ item.entity_type }/${ item.slug }`,
					method: 'DELETE',
				} )
					.then( () => {
						sessionStorage.setItem(
							'gutenberg_entity_saved',
							__( 'Entity deleted successfully.' )
						);
						window.location.reload();
					} )
					.catch( () => {
						createErrorNotice( __( 'Failed to delete entity.' ), {
							type: 'snackbar',
							id: 'entity-delete-error',
						} );
					} );
			},
		} ),
		[ createErrorNotice ]
	);

	const revertAction: Action< EntityConfig > = useMemo(
		() => ( {
			id: 'revert',
			label: __( 'Revert to default' ),
			isPrimary: false,
			isEligible( item: EntityConfig ) {
				return (
					item._source === 'plugin' &&
					! item._orphaned &&
					item._customized
				);
			},
			callback( items: EntityConfig[] ) {
				const item = items[ 0 ];
				apiFetch( {
					path: `/gutenberg/v1/entity-configs/${ item.entity_type }/${ item.slug }`,
					method: 'DELETE',
				} )
					.then( () => {
						sessionStorage.setItem(
							'gutenberg_entity_saved',
							__( 'Entity reverted successfully.' )
						);
						window.location.reload();
					} )
					.catch( () => {
						createErrorNotice( __( 'Failed to revert entity.' ), {
							type: 'snackbar',
							id: 'entity-revert-error',
						} );
					} );
			},
		} ),
		[ createErrorNotice ]
	);

	const actions = useMemo(
		() => [ deleteAction, revertAction ],
		[ deleteAction, revertAction ]
	);

	return (
		<Page title={ __( 'Entities' ) }>
			<div style={ { padding: '16px' } }>
				<Tabs selectedTabId={ activeTab } onSelect={ handleTabChange }>
					<Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.Tab key={ tab.slug } tabId={ tab.slug }>
								{ tab.label }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
				</Tabs>
			</div>
			<DataViews
				data={ data }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ DEFAULT_LAYOUTS }
				getItemId={ getItemId }
				isItemClickable={ () => true }
				renderItemLink={ ( {
					item,
					...props
				}: {
					item: EntityConfig;
				} ) => (
					<Link
						to={ `/edit/${ item.entity_type }/${ item.slug }` }
						{ ...props }
						onClick={ ( event: React.MouseEvent ) => {
							event.stopPropagation();
						} }
					/>
				) }
				header={
					<Button
						variant="primary"
						onClick={ () => {
							navigate( {
								to: `/new/${ activeTab }`,
							} );
						} }
						size="compact"
					>
						{ activeTab === 'post_type'
							? __( 'Add Post Type' )
							: __( 'Add Taxonomy' ) }
					</Button>
				}
			/>
		</Page>
	);
}

export const stage = EntityList;
