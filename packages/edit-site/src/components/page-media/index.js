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
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { getQueryArgs } from '@wordpress/url';
import {
	Button,
	SearchControl,
	CheckboxControl,
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	Icon,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { grid, list, video, audio, page } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Page from '../page';
import Table from '../table';
import Grid from './grid';
// @todo abstract for common usage.
import Pagination from '../page-patterns/pagination';
import FilterControl from './filter-control';

/**
 * @typedef {Object} Attachment
 * @property {{raw: string, rendered: string}} title The name of the attachment.
 */

/** @type {import('@tanstack/react-table').ColumnHelper<Attachment>} */
const columnHelper = createColumnHelper();

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
	columnHelper.accessor( ( row ) => row.title.rendered, {
		id: 'title',
		header: __( 'Title' ),
		cell: ( info ) => (
			<HStack justify="flex-start">
				{ getMediaThumbnail( info.row.original ) }
				<h4>{ info.getValue() }</h4>
			</HStack>
		),
		sortingFn: 'alphanumeric',
	} ),
	columnHelper.accessor( 'attachment_tags', {
		id: 'tags',
		header: () => __( 'Tags' ),
		cell: ( info ) => (
			<HStack>
				{ info.getValue().map( ( tagId ) => (
					<span
						key={ tagId }
						style={ { background: '#ddd', padding: '0.1em 0.5em' } }
					>
						{
							info.table.options.meta.tags.find(
								( tag ) => tag.id === tagId
							)?.name
						}
					</span>
				) ) }
			</HStack>
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
	columnHelper.accessor( 'date_gmt', {
		header: () => __( 'Date' ),
		cell: ( info ) => (
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

// Getting headings, etc. based on `mediaType` query type.
export function getMediaThumbnail( attachment ) {
	if ( 'image' === attachment?.media_type ) {
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

	if ( attachment?.mime_type.startsWith( 'audio' ) ) {
		return <Icon icon={ audio } size={ 128 } />;
	}

	if ( attachment?.mime_type.startsWith( 'video' ) ) {
		return <Icon icon={ video } size={ 128 } />;
	}

	// Everything else is a file.
	return <Icon icon={ page } size={ 128 } />;
}

export default function PageMedia() {
	const { mediaType } = getQueryArgs( window.location.href );
	const { attachments, tags, locale } = useSelect(
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
				attachments: _attachments || EMPTY_ARRAY,
				tags: _tags || EMPTY_ARRAY,
				locale: settings.locale,
			};
		},
		[ mediaType ]
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
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		meta: {
			tags,
			dateFormatter,
		},
		enableMultiRowSelection: true,
		enableSorting: true,
		enableHiding: true,
		enableFilters: true,
	} );
	window.table = table;

	const [ authorFilter, setAuthorFilter ] = useState( [] );
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
						<Button variant="primary">
							{ __( 'Upload new' ) }
						</Button>
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
							<FilterControl
								label={ __( 'Author' ) }
								value={ authorFilter }
								options={ [
									{ label: __( 'Saxon' ), value: 'saxon' },
									{ label: __( 'Isabel' ), value: 'isabel' },
									{ label: __( 'Ramon' ), value: 'ramon' },
									{ label: __( 'Andy' ), value: 'andy' },
									{
										label: __( 'Kai' ),
										value: 'kai',
									},
									{ label: __( 'Rob' ), value: 'rob' },
								] }
								multiple
								onChange={ setAuthorFilter }
							/>
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
