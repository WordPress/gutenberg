/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, useMemo, useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import Page from '../page';
import { DataViews } from '../dataviews';
import { useAddedBy, AvatarImage } from '../list/added-by';

const EMPTY_ARRAY = [];

const DEFAULT_VIEW = {
	type: 'list',
	search: '',
	page: 1,
	perPage: 20,
	// All fields are visible by default, so it's
	// better to keep track of the hidden ones.
	hiddenFields: [],
	layout: {},
};

function AuthorField( { item } ) {
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );
	return (
		<HStack alignment="left">
			{ imageUrl ? (
				<AvatarImage imageUrl={ imageUrl } />
			) : (
				<div className="edit-site-list-added-by__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span>{ text }</span>
		</HStack>
	);
}

export default function PageMedia() {
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const { records: attachments, isResolving: isLoadingData } =
		useEntityRecords( 'root', 'media', {
			per_page: -1,
		} );

	const mediaItems = useMemo( () => {
		if ( ! attachments ) {
			return EMPTY_ARRAY;
		}
		return attachments.map( ( item ) => ( {
			title: item.title?.rendered || item.slug || __( '(no title)' ),
			type: item.media_type,
			alt: item.alt_text,
			thumbnail: item?.media_details?.sizes?.thumbnail?.source_url,
			filesize: item?.media_details?.filesize,
			author: item?.author,
		} ) );
	}, [ attachments ] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				header: __( 'Media item' ),
				getValue: ( { item } ) => item.title,
				render: ( { item } ) => (
					<HStack spacing={ 2 } justify="flex-start">
						<img
							src={ item.thumbnail }
							alt={ item.alt }
							style={ {
								maxHeight: '80px',
							} }
						/>
						<Heading as="h3" level={ 5 }>
							{ decodeEntities( item.title ) }
						</Heading>
					</HStack>
				),
				maxWidth: 400,
				enableHiding: false,
			},
			{
				id: 'type',
				header: __( 'Type' ),
				getValue: ( { item } ) => item.type,
				render: ( { item } ) => item.type,
			},
			{
				id: 'filesize',
				header: __( 'Filesize' ),
				getValue: ( { item } ) => item?.filesize,
				render: ( { item } ) =>
					`${ Math.round( item?.filesize / 1000 ) } kb`,
			},
			{
				id: 'author',
				header: __( 'Author' ),
				getValue: ( { item } ) => item.author,
				render: ( { item } ) => <AuthorField item={ item } />,
			},
		],
		[]
	);
	const { paginationInfo, shownTemplates } = useMemo( () => {
		if ( ! attachments ) {
			return {
				shownTemplates: EMPTY_ARRAY,
				paginationInfo: { totalItems: 0, totalPages: 0 },
			};
		}
		let filteredAttachments = [ ...mediaItems ];
		// Handle global search.
		if ( view.search ) {
			filteredAttachments = filteredAttachments.filter( ( item ) => {
				return (
					item.title.includes( view.search ) ||
					item.description.includes( view.search )
				);
			} );
		}
		// Handle sorting.
		// TODO: Explore how this can be more dynamic..
		if ( view.sort ) {
			if ( view.sort.direction === 'asc' ) {
				filteredAttachments.sort( ( a, b ) =>
					// eslint-disable-next-line no-nested-ternary
					a[ view.sort.field ] > b[ view.sort.field ]
						? 1
						: a[ view.sort.field ] < b[ view.sort.field ]
						? -1
						: 0
				);
			} else {
				filteredAttachments.sort( ( a, b ) =>
					// eslint-disable-next-line no-nested-ternary
					a[ view.sort.field ] < b[ view.sort.field ]
						? 1
						: a[ view.sort.field ] > b[ view.sort.field ]
						? -1
						: 0
				);
			}
		}

		// Handle pagination.
		const start = ( view.page - 1 ) * view.perPage;
		const totalItems = filteredAttachments?.length || 0;
		filteredAttachments = filteredAttachments?.slice(
			start,
			start + view.perPage
		);
		return {
			shownTemplates: filteredAttachments,
			paginationInfo: {
				totalItems,
				totalPages: Math.ceil( totalItems / view.perPage ),
			},
		};
	}, [ mediaItems, view ] );

	const onChangeView = useCallback(
		( viewUpdater ) => {
			const updatedView =
				typeof viewUpdater === 'function'
					? viewUpdater( view )
					: viewUpdater;
			setView( updatedView );
		},
		[ view, setView ]
	);
	return (
		<Page
			title={ __( 'Media' ) }
			/*actions={} Upload flow */
		>
			<DataViews
				// paginationInfo: totalItems and totalPages are required
				paginationInfo={ paginationInfo }
				actions={ [] }
				// onChangeView: required
				onChangeView={ onChangeView }
				// data: must be []
				data={ shownTemplates }
				// fields: required
				fields={ fields }
				isLoading={ isLoadingData }
				view={ view }
				supportedLayouts={ [ 'list', 'grid' ] }
			/>
		</Page>
	);
}
