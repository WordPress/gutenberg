/**
 * WordPress dependencies
 */
import { useState, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { store as noticesStore } from '@wordpress/notices';
import { createBlock, cloneBlock } from '@wordpress/blocks';
import { mediaThumbnailField } from '@wordpress/media-fields';
import { isBlobURL } from '@wordpress/blob';
import { getFilename } from '@wordpress/url';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useOpenverseResults from './use-openverse-results';
import { unlock } from '../../lock-unlock';

const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );

const LAYOUT_GRID = 'grid';

const SOURCE_LIBRARY = 'library';
const SOURCE_OPENVERSE = 'openverse';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

/**
 * Normalizes a WP attachment record into the common item shape.
 *
 * @param {Object} attachment WP attachment record.
 * @return {Object} Normalized media item.
 */
function normalizeAttachment( attachment ) {
	const mediaType = attachment.media_type || 'image';
	return {
		id: String( attachment.id ),
		title:
			attachment.title?.raw ||
			attachment.title?.rendered ||
			__( '(no title)' ),
		thumbnailUrl:
			attachment.media_details?.sizes?.medium?.source_url ||
			attachment.source_url,
		url: attachment.source_url,
		mediaType,
		mimeType: attachment.mime_type,
		alt: attachment.alt_text,
		caption: attachment.caption?.raw,
		source: SOURCE_LIBRARY,
		wpId: attachment.id,
		_raw: attachment,
	};
}

/**
 * Creates a block from a normalized media item.
 *
 * @param {Object} item      Normalized media item.
 * @param {string} mediaType The media type (image, video, audio).
 * @return {Object} A WordPress block.
 */
function createMediaBlock( item, mediaType ) {
	const attributes = {
		id: item.wpId || undefined,
		caption: item.caption || undefined,
	};

	if ( mediaType === 'image' ) {
		attributes.url = item.url;
		attributes.alt = item.alt;
	} else if ( [ 'video', 'audio' ].includes( mediaType ) ) {
		attributes.src = item.url;
	}

	return createBlock( `core/${ mediaType }`, attributes );
}

const DEFAULT_VIEW = {
	type: LAYOUT_GRID,
	fields: [],
	showTitle: false,
	titleField: 'title',
	mediaField: 'media_thumbnail',
	search: '',
	page: 1,
	perPage: 20,
	filters: [],
	layout: {
		previewSize: 120,
		density: 'compact',
	},
};

const DEFAULT_LAYOUTS = {
	[ LAYOUT_GRID ]: {
		fields: [],
		showTitle: false,
		layout: {
			previewSize: 120,
			density: 'compact',
		},
	},
};

/**
 * DataViews-based media inserter panel.
 * Provides a unified media browsing experience with source switching
 * (Media Library / Openverse), search, filters, and pagination.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onInsert Callback to insert a block.
 */
export default function InserterMediaPanel( { onInsert } ) {
	const [ activeSource, setActiveSource ] = useState( SOURCE_LIBRARY );
	const [ view, setView ] = useState( DEFAULT_VIEW );

	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const { getSettings, getBlock } = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const isOpenverse = activeSource === SOURCE_OPENVERSE;

	// Build query args for WP library from view state.
	const libraryQueryArgs = useMemo( () => {
		const filters = {};
		view.filters?.forEach( ( filter ) => {
			if ( filter.field === 'media_type' ) {
				filters.media_type = filter.value;
			}
		} );

		return {
			per_page: view.perPage || 20,
			page: view.page || 1,
			status: 'inherit',
			order: view.sort?.direction || 'desc',
			orderby: view.sort?.field || 'date',
			search: view.search,
			media_type: filters.media_type || undefined,
			_embed: 'author',
		};
	}, [ view ] );

	// WP library data.
	const {
		records: libraryRecords,
		isResolving: isLibraryLoading,
		totalItems: libraryTotalItems,
		totalPages: libraryTotalPages,
	} = useEntityRecordsWithPermissions(
		'postType',
		'attachment',
		libraryQueryArgs,
		{
			enabled: ! isOpenverse,
		}
	);

	// Openverse data.
	const {
		data: openverseData,
		totalItems: openverseTotalItems,
		totalPages: openverseTotalPages,
		isLoading: isOpenverseLoading,
	} = useOpenverseResults( {
		search: view.search || '',
		page: view.page || 1,
		perPage: view.perPage || 20,
		isEnabled: isOpenverse,
	} );

	// Normalize WP library records.
	const libraryData = useMemo( () => {
		if ( ! libraryRecords ) {
			return [];
		}
		return libraryRecords.map( normalizeAttachment );
	}, [ libraryRecords ] );

	// Select active data/pagination based on source.
	const data = isOpenverse ? openverseData : libraryData;
	const isLoading = isOpenverse ? isOpenverseLoading : isLibraryLoading;
	const paginationInfo = useMemo(
		() => ( {
			totalItems: isOpenverse
				? openverseTotalItems
				: libraryTotalItems || 0,
			totalPages: isOpenverse
				? openverseTotalPages
				: libraryTotalPages || 0,
		} ),
		[
			isOpenverse,
			openverseTotalItems,
			openverseTotalPages,
			libraryTotalItems,
			libraryTotalPages,
		]
	);

	// Field definitions for DataViews.
	const fields = useMemo(
		() => [
			{
				...mediaThumbnailField,
				id: 'media_thumbnail',
				enableHiding: false,
				getValue: ( { item } ) => item.thumbnailUrl,
				render: ( { item } ) =>
					item.thumbnailUrl ? (
						<img
							src={ item.thumbnailUrl }
							alt={ item.alt || item.title }
							style={ {
								width: '100%',
								height: '100%',
								objectFit: 'cover',
							} }
						/>
					) : null,
			},
			{
				id: 'title',
				type: 'text',
				label: __( 'Title' ),
				getValue: ( { item } ) => item.title,
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'media_type',
				type: 'text',
				label: __( 'Type' ),
				getValue: ( { item } ) => item.mediaType,
				elements: [
					{ value: 'image', label: __( 'Image' ) },
					{ value: 'video', label: __( 'Video' ) },
					{ value: 'audio', label: __( 'Audio' ) },
				],
				filterBy: {
					operators: [ 'is' ],
					isPrimary: ! isOpenverse,
				},
				enableSorting: false,
				enableHiding: false,
			},
		],
		[ isOpenverse ]
	);

	// Handle click-to-insert for a media item.
	const handleClickItem = useCallback(
		( item ) => {
			if ( ! item ) {
				return;
			}

			const mediaType = item.mediaType || 'image';

			// WP library item — direct insert.
			if ( item.source === SOURCE_LIBRARY && item.wpId ) {
				const block = createMediaBlock( item, mediaType );
				onInsert( block );
				return;
			}

			// External item (Openverse) — fetch and upload.
			const settings = getSettings();
			const block = createMediaBlock( item, mediaType );

			// If user can't upload, insert with external URL.
			if ( ! settings.mediaUpload ) {
				onInsert( block );
				return;
			}

			// Clone the block once so the same clientId is used
			// across multiple onFileChange callbacks.
			const clonedBlock = cloneBlock( block );

			window
				.fetch( item.url )
				.then( ( response ) => response.blob() )
				.then( ( blob ) => {
					const fileName = getFilename( item.url ) || 'image.jpg';
					const file = new File( [ blob ], fileName, {
						type: blob.type,
					} );

					settings.mediaUpload( {
						filesList: [ file ],
						additionalData: { caption: item.caption },
						onFileChange( [ img ] ) {
							if ( isBlobURL( img.url ) ) {
								return;
							}

							if ( ! getBlock( clonedBlock.clientId ) ) {
								onInsert( {
									...clonedBlock,
									attributes: {
										...clonedBlock.attributes,
										id: img.id,
										url: img.url,
									},
								} );
								createSuccessNotice(
									__( 'Image uploaded and inserted.' ),
									{
										type: 'snackbar',
										id: 'inserter-notice',
									}
								);
							} else {
								updateBlockAttributes( clonedBlock.clientId, {
									...clonedBlock.attributes,
									id: img.id,
									url: img.url,
								} );
							}
						},
						allowedTypes: ALLOWED_MEDIA_TYPES,
						onError( message ) {
							createErrorNotice( message, {
								type: 'snackbar',
								id: 'inserter-notice',
							} );
						},
					} );
				} )
				.catch( () => {
					// If fetch fails (CORS), insert with external URL.
					onInsert( block );
					createSuccessNotice( __( 'Image inserted.' ), {
						type: 'snackbar',
						id: 'inserter-notice',
					} );
				} );
		},
		[
			onInsert,
			getSettings,
			getBlock,
			updateBlockAttributes,
			createErrorNotice,
			createSuccessNotice,
		]
	);

	// Reset page when switching sources.
	const handleSourceChange = useCallback( ( newSource ) => {
		setActiveSource( newSource );
		setView( ( prev ) => ( {
			...prev,
			page: 1,
			search: '',
			filters: [],
		} ) );
	}, [] );

	return (
		<div className="inserter-media-panel">
			<div className="inserter-media-panel__source-switcher">
				<button
					className={ `inserter-media-panel__source-button ${
						! isOpenverse
							? 'inserter-media-panel__source-button--active'
							: ''
					}` }
					onClick={ () => handleSourceChange( SOURCE_LIBRARY ) }
				>
					{ __( 'Media Library' ) }
				</button>
				<button
					className={ `inserter-media-panel__source-button ${
						isOpenverse
							? 'inserter-media-panel__source-button--active'
							: ''
					}` }
					onClick={ () => handleSourceChange( SOURCE_OPENVERSE ) }
				>
					{ __( 'Openverse' ) }
				</button>
			</div>
			<DataViews
				data={ data }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				onClickItem={ handleClickItem }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ DEFAULT_LAYOUTS }
				getItemId={ ( item ) => item.id }
				searchLabel={ __( 'Search media' ) }
			/>
		</div>
	);
}
