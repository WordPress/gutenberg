/**
 * External dependencies
 */
import {
	useReactTable,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	getPaginationRowModel,
} from '@tanstack/react-table';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import {
	SearchControl,
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	FormFileUpload,
	Button,
	FlexBlock,
	VisuallyHidden,
} from '@wordpress/components';
import { useState, useMemo, useRef } from '@wordpress/element';
import { grid, list } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { uploadMedia } from '@wordpress/media-utils';
import { store as noticesStore } from '@wordpress/notices';
import { isBlobURL } from '@wordpress/blob';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { getScrollContainer } from '@wordpress/dom';

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
import { getMediaItem } from './get-media';
import { unlock } from '../../lock-unlock';
import MediaActions from './media-actions';

const { useLocation, useHistory } = unlock( routerPrivateApis );

/**
 * @typedef {Object} Attachment
 * @property {number}                          [id]            The ID of the attachment.
 * @property {{raw: string, rendered: string}} [title]         The title of the attachment.
 * @property {{id: number, name: string}[]}    attachment_tags The tags of the attachment.
 * @property {{id: number, name: string}}      [author]        The author of the attachment.
 * @property {number}                          [post]          The post the attachment is attached to.
 * @property {string}                          [date_gmt]      The date the attachment was created.
 * @property {string}                          [formattedDate] The formatted date the attachment was created.
 * @property {string}                          [url]           The URL of the attachment.
 */

/** @type {import('@tanstack/react-table').ColumnHelper<Attachment>} */
const columnHelper = createColumnHelper();

function GridItemButton( { item } ) {
	const {
		params: { path },
	} = useLocation();

	const mediaType = path.split( '/media/' )[ 1 ];
	const linkProps = useLink( {
		postType: 'attachment',
		mediaType,
		postId: item.id,
	} );
	return (
		<Button className="edit-site-media-item__name" { ...linkProps }>
			<div className="edit-site-medi-item__image-wrapper">
				{ getMediaItem( item ) }
			</div>
			<h4>{ item.title.rendered }</h4>
		</Button>
	);
}

function TagsCellButton( { attachmentId, tags = [] } ) {
	const { records: allTags } = useEntityRecords(
		'taxonomy',
		'attachment_tag',
		{
			per_page: -1,
		}
	);
	const { saveEntityRecord } = useDispatch( coreStore );
	const tagIds = tags.map( ( tag ) => tag.id );
	return (
		<FilterControl
			placeholder={ __( 'Select or add tag' ) }
			value={ tagIds }
			options={
				allTags?.map( ( tag ) => ( {
					value: tag.id,
					label: tag.name,
				} ) ) ?? []
			}
			multiple
			hideClear
			onChange={ async ( newTagIds ) => {
				await saveEntityRecord( 'root', 'media', {
					id: attachmentId,
					attachment_tags: newTagIds,
				} );
			} }
			onCreate={ async ( input ) => {
				const newTag = await saveEntityRecord(
					'taxonomy',
					'attachment_tag',
					{
						name: input,
					}
				);
				if ( newTag ) {
					await saveEntityRecord( 'root', 'media', {
						id: attachmentId,
						attachment_tags: [ ...tagIds, newTag.id ],
					} );
				}
			} }
		>
			{ ( { onToggle } ) => (
				<Button onClick={ onToggle }>
					{ tags.length ? (
						<HStack>
							{ tags.map( ( tag ) => (
								<span
									key={ tag.id }
									style={ {
										background: '#ddd',
										padding: '0.1em 0.5em',
									} }
								>
									{ tag.name }
								</span>
							) ) }
						</HStack>
					) : (
						__( 'Add tag' )
					) }
				</Button>
			) }
		</FilterControl>
	);
}

const columns = [
	// columnHelper.display( {
	// 	id: 'select',
	// 	header: ( { table } ) => (
	// 		<CheckboxControl
	// 			checked={ table.getIsAllPageRowsSelected() }
	// 			onChange={ ( value ) =>
	// 				table.toggleAllPageRowsSelected( !! value )
	// 			}
	// 			aria-label={ __( 'Select all' ) }
	// 		/>
	// 	),
	// 	cell: ( { row } ) => (
	// 		<CheckboxControl
	// 			checked={ row.getIsSelected() }
	// 			onChange={ ( value ) => row.toggleSelected( !! value ) }
	// 			aria-label={ __( 'Select row' ) }
	// 		/>
	// 	),
	// 	enableSorting: false,
	// 	enableHiding: false,
	// } ),
	columnHelper.accessor( ( row ) => row.title?.rendered ?? '', {
		id: 'title',
		header: () => __( 'Title' ),
		cell: ( info ) =>
			isBlobURL( info.row.original.url ) ? (
				getMediaItem( info.row.original )
			) : (
				<GridItemButton item={ info.row.original } />
			),
		sortingFn: 'alphanumeric',
		enableGlobalFilter: true,
	} ),
	columnHelper.accessor(
		// Return a string so that the global filter can match against it.
		( row ) => row.attachment_tags.map( ( tag ) => tag.name ).join( ' ' ),
		{
			id: 'tags',
			header: () => __( 'Tags' ),
			cell: ( info ) => (
				<TagsCellButton
					attachmentId={ info.row.original.id }
					tags={ info.row.original.attachment_tags }
				/>
			),
			filterFn: ( row, _columnId, filterValue ) => {
				return (
					! filterValue.length ||
					filterValue.some( ( tagId ) =>
						row.original.attachment_tags.some(
							( tag ) => tag.id === tagId
						)
					)
				);
			},
			enableGlobalFilter: true,
		}
	),
	columnHelper.accessor( ( row ) => row.post?.title?.rendered ?? '', {
		id: 'post',
		header: () => __( 'Attached to' ),
		cell: ( info ) => info.getValue(),
		sortingFn: 'alphanumeric',
		enableGlobalFilter: true,
	} ),
	columnHelper.accessor( ( row ) => row.author?.name ?? '', {
		id: 'author',
		header: () => __( 'Author' ),
		cell: ( info ) => info.getValue(),
		sortingFn: 'alphanumeric',
		filterFn: ( row, _columnId, filterValue ) => {
			return (
				! filterValue.length ||
				filterValue.some(
					( authorId ) => row.original.author?.id === authorId
				)
			);
		},
		enableGlobalFilter: true,
	} ),
	columnHelper.accessor( 'formattedDate', {
		header: () => __( 'Date' ),
		cell: ( info ) =>
			info.getValue() && (
				<time dateTime={ info.row.original.date_gmt }>
					{ info.getValue() }
				</time>
			),
		sortingFn: ( rowA, rowB ) =>
			new Date( rowA.original.date_gmt ) -
			new Date( rowB.original.date_gmt ),
	} ),
	columnHelper.display( {
		id: 'actions',
		header: () => <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
		cell: ( { row: { original: attachment } } ) => (
			<MediaActions attachmentId={ attachment.id } />
		),
		enableSorting: false,
		enableHiding: false,
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

const parseQueryParamFilter = ( filter ) =>
	filter ? filter.split( ',' ).map( ( str ) => parseInt( str, 10 ) ) : [];

export default function PageMedia() {
	const { params } = useLocation();
	const {
		path,
		tags: tagsFilter = '',
		author: authorFilter = '',
		p: pageIndex = 0,
		view = 'table',
	} = params;
	const history = useHistory();

	const mediaType = path.split( '/media/' )[ 1 ];
	const { persistedAttachments, tags, locale, users } = useSelect(
		( select ) => {
			const _mediaType = mediaType === 'all' ? undefined : mediaType;
			const {
				getMediaItems,
				getEntityRecord,
				getEntityRecords,
				getUsers,
			} = select( coreStore );
			const _attachments = getMediaItems( {
				per_page: -1,
				orderby: 'date',
				order: 'desc',
				// @todo `application` and `text` are valid media types,
				// but we should maybe combine them into `documents`.
				media_type: _mediaType,
			} );
			const _tags = getEntityRecords( 'taxonomy', 'attachment_tag', {
				per_page: -1,
			} );
			const settings = select( blockEditorStore ).getSettings();
			return {
				persistedAttachments: _attachments
					? _attachments.map( ( attachment ) => ( {
							...attachment,
							post:
								attachment.post &&
								getEntityRecord(
									'postType',
									'post',
									attachment.post
								),
					  } ) )
					: EMPTY_ARRAY,
				tags: _tags || EMPTY_ARRAY,
				locale: settings.locale,
				users: getUsers(),
			};
		},
		[ mediaType ]
	);
	const dateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat( locale || 'en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			} ),
		[ locale ]
	);
	const [ transientAttachments, setTransientAttachments ] = useState( [] );
	const attachments = useMemo(
		() => [
			...transientAttachments,
			...persistedAttachments.map( ( attachment ) => ( {
				...attachment,
				attachment_tags: attachment.attachment_tags
					.map( ( tagId ) =>
						tags.find( ( tag ) => tagId === tag.id )
					)
					.filter( ( tag ) => !! tag ),
				author: users?.find(
					( user ) => user.id === attachment.author
				),
				formattedDate: dateFormatter.format(
					new Date( attachment.date_gmt )
				),
			} ) ),
		],
		[
			dateFormatter,
			persistedAttachments,
			tags,
			transientAttachments,
			users,
		]
	);

	/** @type {import('@tanstack/react-table').ColumnFiltersState} */
	const columnFilters = useMemo(
		() => [
			{ id: 'tags', value: parseQueryParamFilter( tagsFilter ) },
			{ id: 'author', value: parseQueryParamFilter( authorFilter ) },
		],
		[ tagsFilter, authorFilter ]
	);
	/** @type {import('@tanstack/react-table').PaginationState} */
	const pagination = useMemo(
		() => ( {
			pageIndex: parseInt( pageIndex, 10 ),
			pageSize: PAGE_SIZE,
		} ),
		[ pageIndex ]
	);
	const [ globalFilter, setGlobalFilter ] = useState( '' );

	const table = useReactTable( {
		data: attachments,
		columns,
		getRowId: ( row ) => row.id,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			pagination,
			columnFilters,
			globalFilter,
		},
		onColumnFiltersChange: ( columnFiltersStateUpdater ) => {
			const columnFiltersState =
				columnFiltersStateUpdater( columnFilters );
			const newParams = { ...params, tags: undefined, author: undefined };
			for ( const columnFilter of columnFiltersState ) {
				if ( [ 'tags', 'author' ].includes( columnFilter.id ) ) {
					newParams[ columnFilter.id ] =
						columnFilter.value.join( ',' );
				}
			}
			history.replace( newParams );
		},
		onPaginationChange: ( paginationStateUpdater ) => {
			const paginationState = paginationStateUpdater( pagination );
			if ( paginationState.pageIndex !== pagination.pageIndex ) {
				history.push( {
					...params,
					p:
						paginationState.pageIndex > 0
							? paginationState.pageIndex
							: undefined,
				} );
			}
		},
		enableMultiRowSelection: false,
		enableSorting: true,
		enableHiding: true,
		enableFilters: true,
	} );

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
				setTransientAttachments(
					newTransientAttachments.map( ( attachment ) => ( {
						...attachment,
						attachment_tags: [],
						post: null,
						author: null,
					} ) )
				);
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

	const pageRef = useRef();

	return (
		<Page
			className="edit-site-media"
			title={ headingText[ mediaType ] || __( 'Media' ) }
			actions={
				<FormFileUpload
					variant="primary"
					multiple
					onChange={ ( event ) => uploadFiles( event.target.files ) }
				>
					{ __( 'Upload new' ) }
				</FormFileUpload>
			}
			ref={ pageRef }
		>
			<Spacer padding={ 7 }>
				<VStack spacing={ 6 }>
					<HStack alignment="left" spacing={ 5 }>
						<SearchControl
							style={ { height: 40 } }
							value={ globalFilter }
							onChange={ setGlobalFilter }
							placeholder={ __( 'Search' ) }
							__nextHasNoMarginBottom
						/>
						<FlexBlock>
							<HStack alignment="left" spacing={ 3 }>
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
										onChange={ ( value ) => {
											table
												.getColumn( 'author' )
												.setFilterValue( value );
										} }
									/>
								) }
							</HStack>
						</FlexBlock>
						<ToggleGroupControl
							label={ __( 'Toggle view' ) }
							hideLabelFromVision
							value={ view }
							__nextHasNoMarginBottom
							size="__unstable-large"
							onChange={ ( value ) => {
								history.replace( {
									...params,
									view: value,
								} );
							} }
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
					{ attachments && 'table' === view && (
						<Table table={ table } />
					) }
					{ attachments && 'grid' === view && (
						<Grid
							items={ table
								.getRowModel()
								.rows.map( ( row ) => row.original ) }
						/>
					) }
					<HStack justify="flex-end">
						{ table.getPageCount() > 1 && (
							<Pagination
								className={ 'edit-site-media__pagination' }
								currentPage={
									table.getState().pagination.pageIndex + 1
								}
								numPages={ table.getPageCount() }
								changePage={ ( page ) => {
									table.setPageIndex( page - 1 );
									getScrollContainer(
										pageRef.current
									).scrollTop = 0;
								} }
								totalItems={
									table.getFilteredRowModel().rows.length
								}
							/>
						) }
					</HStack>
				</VStack>
			</Spacer>
		</Page>
	);
}
