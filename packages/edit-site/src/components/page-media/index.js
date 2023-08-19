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
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
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
	FlexItem,
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

const { useLocation } = unlock( routerPrivateApis );

/**
 * @typedef {Object} Attachment
 * @property {{raw: string, rendered: string}} title The name of the attachment.
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
			{ getMediaItem( item ) }
			<h4>{ item.title.rendered }</h4>
		</Button>
	);
}

function TagsCellButton( { attachmentId, tagIds = [], tags } ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	return (
		<FilterControl
			placeholder={ __( 'Select or add tag' ) }
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
					{ tagIds.length ? (
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
	columnHelper.accessor( ( row ) => row.title?.rendered, {
		id: 'title',
		header: () => __( 'Title' ),
		cell: ( info ) =>
			isBlobURL( info.row.original.url ) ? (
				getMediaItem( info.row.original )
			) : (
				<GridItemButton item={ info.row.original } />
			),
		sortingFn: 'alphanumeric',
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

const headingText = {
	media: __( 'Media' ),
	document: __( 'Documents' ),
	audio: __( 'Audio' ),
	video: __( 'Videos' ),
	image: __( 'Images' ),
};

export default function PageMedia() {
	const {
		params: { path },
	} = useLocation();

	const mediaType = path.split( '/media/' )[ 1 ];
	const { persistedAttachments, tags, locale, users } = useSelect(
		( select ) => {
			const _mediaType = mediaType === 'all' ? undefined : mediaType;
			const _attachments = select( coreStore ).getMediaItems( {
				per_page: -1,
				orderby: 'date',
				order: 'desc',
				// @todo `application` and `text` are valid media types,
				// but we should maybe combine them into `documents`.
				media_type: _mediaType,
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

	const dateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat( locale || 'en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			} ),
		[ locale ]
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
		initialState: {
			pagination: {
				pageSize: 20,
			},
		},
		state: {
			globalFilter,
		},
		meta: {
			tags,
			dateFormatter,
			users,
		},
		enableMultiRowSelection: false,
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
										onChange={
											table.getColumn( 'author' )
												.setFilterValue
										}
									/>
								) }
							</HStack>
						</FlexBlock>
						<FlexItem>
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
						</FlexItem>
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
					{ attachments && 'table' === currentView && (
						<Table table={ table } />
					) }
					{ attachments && 'grid' === currentView && (
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
