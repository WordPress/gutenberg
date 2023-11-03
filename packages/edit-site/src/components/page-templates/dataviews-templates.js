/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import AddedBy from '../list/added-by';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import { DataViews } from '../dataviews';
import DEFAULT_VIEWS from './default-views';
import { useResetTemplateAction } from './template-actions';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];
const defaultConfigPerViewType = {
	list: {},
	grid: {},
};

function normalizeSearchInput( input = '' ) {
	return removeAccents( input.trim().toLowerCase() );
}

export default function DataviewsTemplates() {
	const {
		params: { path, activeView = 'all' },
	} = useLocation();
	const initialView = DEFAULT_VIEWS.find(
		( { slug } ) => slug === activeView
	).view;
	const [ view, setView ] = useState( initialView );
	useEffect( () => {
		setView(
			DEFAULT_VIEWS.find( ( { slug } ) => slug === activeView ).view
		);
	}, [ path, activeView ] );
	const { records: allTemplates, isResolving: isLoadingData } =
		useEntityRecords( 'postType', TEMPLATE_POST_TYPE, {
			per_page: -1,
		} );
	const { shownTemplates, paginationInfo } = useMemo( () => {
		if ( ! allTemplates )
			return {
				shownTemplates: EMPTY_ARRAY,
				paginationInfo: { totalItems: 0, totalPages: 0 },
			};
		let filteredTemplates = [ ...allTemplates ];
		// Handle global search.
		if ( view.search ) {
			const normalizedSearch = normalizeSearchInput( view.search );
			filteredTemplates = filteredTemplates.filter( ( item ) => {
				const title = item.title?.rendered || item.slug;
				return (
					normalizeSearchInput( title ).includes(
						normalizedSearch
					) ||
					normalizeSearchInput( item.description ).includes(
						normalizedSearch
					)
				);
			} );
		}
		// Handle sorting.
		// TODO: Explore how this can be more dynamic..
		if ( view.sort ) {
			if ( view.sort.field === 'title' ) {
				filteredTemplates.sort( ( a, b ) => {
					const titleA = a.title?.rendered || a.slug;
					const titleB = b.title?.rendered || b.slug;
					return view.sort.direction === 'asc'
						? titleA.localeCompare( titleB )
						: titleB.localeCompare( titleA );
				} );
			}
		}
		// Handle pagination.
		const start = ( view.page - 1 ) * view.perPage;
		const totalItems = filteredTemplates?.length || 0;
		filteredTemplates = filteredTemplates?.slice(
			start,
			start + view.perPage
		);
		return {
			shownTemplates: filteredTemplates,
			paginationInfo: {
				totalItems,
				totalPages: Math.ceil( totalItems / view.perPage ),
			},
		};
	}, [ allTemplates, view ] );
	const fields = useMemo(
		() => [
			{
				header: __( 'Template' ),
				id: 'title',
				getValue: ( { item } ) => item.title?.rendered || item.slug,
				render: ( { item } ) => {
					return (
						<VStack spacing={ 1 }>
							<Heading as="h3" level={ 5 }>
								<Link
									params={ {
										postId: item.id,
										postType: item.type,
										canvas: 'edit',
									} }
								>
									{ decodeEntities(
										item.title?.rendered || item.slug
									) || __( '(no title)' ) }
								</Link>
							</Heading>
							{ item.description && (
								<Text variant="muted">
									{ decodeEntities( item.description ) }
								</Text>
							) }
						</VStack>
					);
				},
				maxWidth: 400,
				sortingFn: 'alphanumeric',
				enableHiding: false,
			},
			{
				header: __( 'Added by' ),
				id: 'added-by',
				getValue: () => {},
				render: ( { item } ) => {
					return (
						<AddedBy postType={ item.type } postId={ item.id } />
					);
				},
				enableHiding: false,
				enableSorting: false,
			},
		],
		[]
	);
	const resetTemplateAction = useResetTemplateAction();
	const actions = useMemo(
		() => [ resetTemplateAction ],
		[ resetTemplateAction ]
	);
	const onChangeView = useCallback(
		( viewUpdater ) => {
			let updatedView =
				typeof viewUpdater === 'function'
					? viewUpdater( view )
					: viewUpdater;
			if ( updatedView.type !== view.type ) {
				updatedView = {
					...updatedView,
					layout: {
						...defaultConfigPerViewType[ updatedView.type ],
					},
				};
			}

			setView( updatedView );
		},
		[ view, setView ]
	);
	return (
		<Page title={ __( 'Templates' ) }>
			<DataViews
				paginationInfo={ paginationInfo }
				fields={ fields }
				actions={ actions }
				data={ shownTemplates || EMPTY_ARRAY }
				isLoading={ isLoadingData }
				view={ view }
				onChangeView={ onChangeView }
			/>
		</Page>
	);
}
