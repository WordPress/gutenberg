/**
 * External dependencies
 */
import {
	useReactTable,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
} from '@tanstack/react-table';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { getQueryArgs } from '@wordpress/url';
import {
	SearchControl,
	CheckboxControl,
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	Icon,
	FormFileUpload,
	Button,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { grid, list, video, audio, page } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { uploadMedia } from '@wordpress/media-utils';
import { store as noticesStore } from '@wordpress/notices';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import Page from '../page';
import Table from '../table';
import Grid from './grid';
// @todo abstract for common usage.
import Pagination from '../page-patterns/pagination';
import FilterControl from './filter-control';
import { useLink } from '../routes/link';

/**
 * @typedef {Object} Attachment
 * @property {{raw: string, rendered: string}} title The name of the attachment.
 */

/** @type {import('@tanstack/react-table').ColumnHelper<Attachment>} */
const columnHelper = createColumnHelper();

function GridItemButton( { item } ) {
	const linkProps = useLink( {
		postType: 'attachment',
		postId: item.id,
	} );
	return (
		<Button { ...linkProps }>
			<HStack justify="flex-start">
				{ getMediaThumbnail( item ) }
				<h4>{ item.title.rendered }</h4>
			</HStack>
		</Button>
	);
}

function TagsCellButton( { attachmentId, tagIds, tags } ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	return (
		<FilterControl
			placeholder={ __( 'Select or create tags' ) }
			value={ tagIds }
			options={ tags.map( ( tag ) => ( {
				value: tag.id,
				label: tag.name,
			} ) ) }
			multiple
			hideClear
			onChange={ async ( newTagIds ) => {
				await saveEntityRecord( 'root', 'media', {
					id: attachmentId,
					attachment_tags: newTagIds,
				} );
			} }
			onCreate={ async ( input ) => {
				const { id: newTagId } = await saveEntityRecord(
					'taxonomy',
					'attachment_tag',
					{
						name: input,
					}
				);
				await saveEntityRecord( 'root', 'media', {
					id: attachmentId,
					attachment_tags: [ ...tagIds, newTagId ],
				} );
			} }
		>
			{ ( { onToggle } ) => (
				<Button onClick={ onToggle }>
					<HStack>
						{ tagIds.map( ( tagId ) => (
							<span
								key={ tagId }
								style={ {
									background: '#ddd',
									padding: '0.1em 0.5em',
								} }
							>
								{
									tags.find( ( tag ) => tag.id === tagId )
										?.name
								}
							</span>
						) ) }
					</HStack>
				</Button>
			) }
		</FilterControl>
	);
}

const columns = [
	columnHelper.display( {
		id: 'select',
		header: ( { table } ) => (
			<CheckboxControl
				checked={ table.getIsAllPageRowsSelected() }
				onChange={ ( value ) =>
					table.toggleAllPageRowsSelected( !! value )
				}
				aria-label={ __( 'Select all' ) }
			/>
		),
		cell: ( { row } ) => (
			<CheckboxControl
				checked={ row.getIsSelected() }
				onChange={ ( value ) => row.toggleSelected( !! value ) }
				aria-label={ __( 'Select row' ) }
			/>
		),
		enableSorting: false,
		enableHiding: false,
	} ),
	columnHelper.accessor( ( row ) => row.title?.rendered, {
		id: 'title',
		header: () => __( 'Title' ),
		cell: ( info ) =>
			isBlobURL( info.row.original.url ) ? (
				getMediaThumbnail( info.row.original )
			) : (
				<GridItemButton item={ info.row.original } />
			),
	} ),
	columnHelper.accessor( 'attachment_tags', {
		id: 'tags',
		header: () => __( 'Tags' ),
		cell: ( info ) => (
			<TagsCellButton
				attachmentId={ info.row.original.id }
				tagIds={ info.getValue() }
				tags={ info.table.options.meta.tags }
			/>
		),
		filterFn: 'arrIncludesAll',
	} ),
	columnHelper.accessor( 'post', {
		header: () => __( 'Attached to' ),
		cell: function AttachedToCell( info ) {
			const { record } = useEntityRecord(
				'postType',
				'post',
				info.getValue()
			);
			const postTitle = record?.title?.rendered;
			return postTitle ? <span>{ postTitle }</span> : null;
		},
		sortingFn: 'alphanumeric',
	} ),
	columnHelper.accessor( 'author', {
		header: () => __( 'Author' ),
		cell: ( info ) => {
			const users = info.table.options.meta.users;
			if ( ! users ) return null;
			return users.find( ( user ) => user.id === info.getValue() )?.name;
		},
		sortingFn: 'alphanumeric',
	} ),
	columnHelper.accessor( 'date_gmt', {
		header: () => __( 'Date' ),
		cell: ( info ) =>
			info.getValue() && (
				<time dateTime={ info.getValue() }>
					{ info.table.options.meta.dateFormatter.format(
						new Date( info.getValue() )
					) }
				</time>
			),
		sortingFn: 'datetime',
	} ),
];

const EMPTY_ARRAY = [];
const PAGE_SIZE = 20;

const headingText = {
	media: __( 'Media' ),
	document: __( 'Documents' ),
	audio: __( 'Audio' ),
	video: __( 'Videos' ),
	image: __( 'Images' ),
};

export function getMediaTypeFromMimeType( mimeType ) {
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

// Getting headings, etc. based on `mediaType` query type.
export function getMediaThumbnail( attachment ) {
	if ( isBlobURL( attachment.url ) ) {
		return (
			<img
				height={ 100 }
				width={ 100 }
				style={ { borderRadius: '8px', flexShrink: 0 } }
				src={ attachment.url }
				alt=""
			/>
		);
	}

	const mediaType = getMediaTypeFromMimeType( attachment.mime_type );

	if ( 'image' === mediaType ) {
		return (
			<img
				height={ 100 }
				width={ 100 }
				style={ { borderRadius: '8px', flexShrink: 0 } }
				src={ attachment.media_details.sizes.thumbnail.source_url }
				alt={ attachment.alt_text }
			/>
		);
	}

	if ( 'audio' === mediaType ) {
		return <Icon icon={ audio } size={ 128 } />;
	}

	if ( 'video' === mediaType ) {
		return <Icon icon={ video } size={ 128 } />;
	}

	// Everything else is a file.
	return <Icon icon={ page } size={ 128 } />;
}

export default function PageMedia() {
	const { mediaType } = getQueryArgs( window.location.href );
	const { persistedAttachments, tags, locale, users } = useSelect(
		( select ) => {
			const _attachments = select( coreStore ).getMediaItems( {
				per_page: -1,
				orderby: 'date',
				order: 'desc',
				// @todo `application` and `text` are valid media types,
				// but we should maybe combine them into `documents`.
				media_type: mediaType,
			} );
			const _tags = select( coreStore ).getEntityRecords(
				'taxonomy',
				'attachment_tag',
				{ per_page: -1 }
			);
			const settings = select( blockEditorStore ).getSettings();
			return {
				persistedAttachments: _attachments || EMPTY_ARRAY,
				tags: _tags || EMPTY_ARRAY,
				locale: settings.locale,
				users: select( coreStore ).getUsers(),
			};
		},
		[ mediaType ]
	);
	const [ transientAttachments, setTransientAttachments ] = useState( [] );
	const attachments = useMemo(
		() => [ ...transientAttachments, ...persistedAttachments ],
		[ persistedAttachments, transientAttachments ]
	);

	const totalItems = attachments.length;
	const numPages = Math.ceil( attachments.length / PAGE_SIZE );
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const pageIndex = currentPage - 1;

	const attachmentsOnPage = useMemo( () => {
		return attachments.slice(
			pageIndex * PAGE_SIZE,
			pageIndex * PAGE_SIZE + PAGE_SIZE
		);
	}, [ pageIndex, attachments ] );

	const changePage = ( newPage ) => {
		// @todo Not working yet, we don't have a scroll container.
		// const scrollContainer = document.querySelector( '.edit-site-media' );
		// scrollContainer?.scrollTo( 0, 0 );

		setCurrentPage( newPage );
	};

	const dateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat( locale || 'en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			} ),
		[ locale ]
	);

	const table = useReactTable( {
		data: attachmentsOnPage,
		columns,
		getRowId: ( row ) => row.id,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		meta: {
			tags,
			dateFormatter,
			users,
		},
		enableMultiRowSelection: true,
		enableSorting: true,
		enableHiding: true,
		enableFilters: true,
	} );
	window.table = table;

	const [ sortBy, setSortBy ] = useState( [ 'name' ] );
	const [ currentView, setCurrentView ] = useState( 'table' );
	const tagOptions = useMemo(
		() =>
			tags.map( ( tag ) => ( {
				label: tag.name,
				value: tag.id,
			} ) ),
		[ tags ]
	);

	const { receiveEntityRecords } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const uploadFiles = async ( files ) => {
		await uploadMedia( {
			filesList: files,
			onFileChange: ( newFiles ) => {
				const newTransientAttachments = newFiles.filter( ( file ) =>
					isBlobURL( file.url )
				);
				setTransientAttachments( newTransientAttachments );
				const newMediaItems = newFiles.filter( ( file ) => !! file.id );
				if ( newMediaItems.length ) {
					receiveEntityRecords(
						'root',
						'media',
						newMediaItems,
						undefined,
						true
					);
				}
			},
			onError: ( error ) => {
				createErrorNotice( error.message, { type: 'snackbar' } );
			},
		} );
	};

	return (
		<Page
			className="edit-site-media"
			title={ __( 'Media' ) }
			hideTitleFromUI
		>
			<Spacer padding={ 3 }>
				<VStack spacing={ 3 }>
					<HStack justify="space-between">
						<Heading level={ 2 }>
							{ headingText[ mediaType ] }
						</Heading>
						<FormFileUpload
							variant="primary"
							multiple
							onChange={ ( event ) =>
								uploadFiles( event.target.files )
							}
						>
							{ __( 'Upload new' ) }
						</FormFileUpload>
					</HStack>
					<VStack>
						<HStack justify="flex-start">
							<SearchControl
								style={ { height: 40 } }
								onChange={ () => {} }
								placeholder={ __( 'Search' ) }
								__nextHasNoMarginBottom
							/>
							<FilterControl
								label={ __( 'Tags' ) }
								value={ table
									.getColumn( 'tags' )
									.getFilterValue() }
								options={ tagOptions }
								multiple
								onChange={
									table.getColumn( 'tags' ).setFilterValue
								}
							/>
							{ users && (
								<FilterControl
									label={ __( 'Author' ) }
									value={ table
										.getColumn( 'author' )
										.getFilterValue() }
									options={
										users.map( ( user ) => ( {
											label: user.name,
											value: user.id,
										} ) ) ?? []
									}
									multiple
									onChange={
										table.getColumn( 'author' )
											.setFilterValue
									}
								/>
							) }
							<Spacer />
							<FilterControl
								label={ __( 'Sort' ) }
								value={ sortBy }
								options={ [
									{ label: __( 'Name' ), value: 'name' },
									{ label: __( 'Date' ), value: 'date' },
									{ label: __( 'Author' ), value: 'author' },
								] }
								onChange={ setSortBy }
							/>
							<ToggleGroupControl
								label={ __( 'Toggle view' ) }
								hideLabelFromVision
								value={ currentView }
								__nextHasNoMarginBottom
								size="__unstable-large"
								onChange={ setCurrentView }
							>
								<ToggleGroupControlOptionIcon
									value="table"
									label={ __( 'Table' ) }
									icon={ list }
								/>
								<ToggleGroupControlOptionIcon
									value="grid"
									label={ __( 'Grid' ) }
									icon={ grid }
								/>
							</ToggleGroupControl>
						</HStack>

						{ attachmentsOnPage && 'table' === currentView && (
							<Table table={ table } />
						) }
						{ attachmentsOnPage && 'grid' === currentView && (
							<Grid items={ attachmentsOnPage } />
						) }
					</VStack>

					<HStack justify="flex-end">
						{ numPages > 1 && (
							<Pagination
								className={ 'edit-site-media__pagination' }
								currentPage={ currentPage }
								numPages={ numPages }
								changePage={ changePage }
								totalItems={ totalItems }
							/>
						) }
					</HStack>
				</VStack>
			</Spacer>
		</Page>
	);
}
