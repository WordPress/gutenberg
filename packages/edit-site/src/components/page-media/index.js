/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	DropZone,
	Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, useMemo, useCallback } from '@wordpress/element';
import { page } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Page from '../page';
import { DataViews } from '../dataviews';
import { useAddedBy, AvatarImage } from '../list/added-by';

const EMPTY_ARRAY = [];

const DEFAULT_VIEW = {
	type: 'media-grid',
	search: '',
	page: 1,
	perPage: 20,
	// All fields are visible by default, so it's
	// better to keep track of the hidden ones.
	hiddenFields: [],
	layout: {},
};

function getMediaTypeFromMimeType( mimeType ) {
	// @todo this needs to be abstracted and the
	//  media types formalized somewhere.
	if ( mimeType.startsWith( 'image/' ) ) {
		return 'image';
	}

	if ( mimeType.startsWith( 'video/' ) ) {
		return 'video';
	}

	if ( mimeType.startsWith( 'audio/' ) ) {
		return 'audio';
	}

	return 'application';
}

function getFeaturedImageDetails( post, size ) {
	const image = post._embedded?.[ 'wp:featuredmedia' ]?.[ '0' ];

	return {
		url:
			image?.media_details?.sizes?.[ size ]?.source_url ??
			image?.source_url,
		alt: image?.alt_text,
	};
}

function MediaPreview( { item } ) {
	const mediaType = item?.mimeType
		? getMediaTypeFromMimeType( item?.mimeType )
		: undefined;
	if ( mediaType === 'application' ) {
		return (
			<Tooltip
				text={ `${ item?.title } - ${ item?.filesize / 1000 } kb` }
			>
				<a href={ item?.url } target="_blank" rel="noreferrer">
					<Icon icon={ page } size={ 128 } />
				</a>
			</Tooltip>
		);
	}

	if ( mediaType === 'image' ) {
		return (
			<img
				src={ item.thumbnail }
				alt={ item.alt }
				style={ {
					maxHeight: '80px',
				} }
			/>
		);
	}

	if ( mediaType === 'audio' ) {
		return (
			<audio
				controls="controls"
				src={ item?.url }
				autoPlay={ false }
				preload="true"
			/>
		);
	}

	if ( mediaType === 'video' ) {
		return (
			<video
				controls="controls"
				poster={ item?.featuredImage?.url }
				preload="true"
				src={ item?.url }
				height="80"
				playsInline
			/>
		);
	}

	// Everything else is a file.
	return (
		<div className="edit-site-media-item__icon">
			<Icon icon={ page } />
		</div>
	);
}

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
	const [ hasDropped, setHasDropped ] = useState( false );
	const { records: attachments, isResolving: isLoadingData } =
		useEntityRecords( 'root', 'media', {
			per_page: -1,
			_embed: 'wp:featuredmedia',
		} );

	const mediaItems = useMemo( () => {
		if ( ! attachments ) {
			return EMPTY_ARRAY;
		}
		return attachments.map( ( item ) => ( {
			title: item.title?.rendered || item.slug || __( '(no title)' ),
			type: item.media_type,
			id: item.id,
			alt: item.alt_text,
			thumbnail: item?.media_details?.sizes?.thumbnail?.source_url,
			filesize: item?.media_details?.filesize,
			author: item?.author,
			url: item?.source_url,
			poster: item?.poster,
			mimeType: item?.mime_type,
			featuredImage: getFeaturedImageDetails( item ),
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
						<MediaPreview item={ item } />
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
				getValue: ( { item } ) => item.mimeType,
				render: ( { item } ) => item.mimeType,
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
				supportedLayouts={ [ 'list', 'media-grid' ] }
			/>
			<DropZone
				onFilesDrop={ () => setHasDropped( true ) }
				onHTMLDrop={ () => setHasDropped( true ) }
				onDrop={ () => setHasDropped( true ) }
			/>
		</Page>
	);
}
