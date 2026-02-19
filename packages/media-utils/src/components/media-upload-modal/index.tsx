/**
 * WordPress dependencies
 */
import {
	useState,
	useCallback,
	useMemo,
	useRef,
	useEffect,
} from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import {
	privateApis as coreDataPrivateApis,
	store as coreStore,
} from '@wordpress/core-data';
import { resolveSelect, useDispatch } from '@wordpress/data';
import {
	Modal,
	DropZone,
	FormFileUpload,
	Button,
	Spinner,
	__experimentalVStack as VStack,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { upload as uploadIcon } from '@wordpress/icons';
import { DataViewsPicker } from '@wordpress/dataviews';
import type {
	View,
	Field,
	ActionButton,
	DataViewRenderFieldProps,
} from '@wordpress/dataviews';
import {
	altTextField,
	attachedToField,
	authorField,
	captionField,
	dateAddedField,
	dateModifiedField,
	descriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mediaThumbnailField,
	mimeTypeField,
} from '@wordpress/media-fields';
import { store as noticesStore, SnackbarNotices } from '@wordpress/notices';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import type { Attachment, RestAttachment } from '../../utils/types';
import { transformAttachment } from '../../utils/transform-attachment';
import { uploadMedia } from '../../utils/upload-media';
import { unlock } from '../../lock-unlock';

const { useEntityRecordsWithPermissions } = unlock( coreDataPrivateApis );

// Layout constants - matching the picker layout types
const LAYOUT_PICKER_GRID = 'pickerGrid';
const LAYOUT_PICKER_TABLE = 'pickerTable';

// Custom notices context for the media modal
const NOTICES_CONTEXT = 'media-modal';

// Notice ID - reused for all upload-related notices to prevent flooding
const NOTICE_ID_UPLOAD_PROGRESS = 'media-modal-upload-progress';

// Prefix for transient upload item IDs
const TRANSIENT_ID_PREFIX = 'uploading-';

/**
 * Tracks a file being uploaded with its client-side state.
 */
interface TransientUploadItem {
	/** Unique client-side ID (e.g. 'uploading-0') */
	clientId: string;
	/** The File object being uploaded */
	file: File;
	/** Current upload status */
	status: 'uploading' | 'complete';
}

/**
 * Renders a thumbnail placeholder for a file that is currently uploading
 * or has just finished uploading.
 *
 * @param props            Component props.
 * @param props.filename   The name of the file being uploaded.
 * @param props.isComplete Whether the upload has completed.
 */
function UploadingThumbnailView( {
	filename,
	isComplete,
}: {
	filename: string;
	isComplete?: boolean;
} ) {
	return (
		<div
			className={ `dataviews-media-field__media-thumbnail media-upload-modal__uploading-thumbnail${
				isComplete ? ' is-complete' : ''
			}` }
		>
			<VStack
				justify="center"
				alignment="center"
				className="dataviews-media-field__media-thumbnail__stack"
				spacing={ 0 }
			>
				<Spinner />
				{ !! filename && (
					<div className="dataviews-media-field__media-thumbnail__filename">
						<Truncate className="dataviews-media-field__media-thumbnail__filename__truncate">
							{ filename }
						</Truncate>
					</div>
				) }
			</VStack>
		</div>
	);
}

interface MediaUploadModalProps {
	/**
	 * Array of allowed media types.
	 */
	allowedTypes?: string[];

	/**
	 * Whether multiple files can be selected.
	 * @default false
	 */
	multiple?: boolean;

	/**
	 * The currently selected media item(s).
	 * Can be a single ID number or array of IDs for multiple selection.
	 */
	value?: number | number[];

	/**
	 * Function called when media is selected.
	 * Receives single attachment object or array of attachments.
	 */
	onSelect: ( media: Attachment | Attachment[] ) => void;

	/**
	 * Function called when the modal is closed without selection.
	 */
	onClose?: () => void;

	/**
	 * Function to handle media uploads.
	 * If not provided, drag and drop will be disabled.
	 */
	onUpload?: ( args: {
		allowedTypes?: string[];
		filesList: File[];
		onFileChange?: ( attachments: Partial< Attachment >[] ) => void;
		onError?: ( error: Error ) => void;
		multiple?: boolean;
	} ) => void;

	/**
	 * Title for the modal.
	 * @default 'Select Media'
	 */
	title?: string;

	/**
	 * Whether the modal is open.
	 */
	isOpen: boolean;

	/**
	 * Whether the modal can be closed by clicking outside or pressing escape.
	 * @default true
	 */
	isDismissible?: boolean;

	/**
	 * Additional CSS class for the modal.
	 */
	modalClass?: string;

	/**
	 * Whether to show a search input.
	 * @default true
	 */
	search?: boolean;

	/**
	 * Label for the search input.
	 */
	searchLabel?: string;
}

/**
 * MediaUploadModal component that uses Modal and DataViewsPicker for media selection.
 *
 * This is a modern functional component alternative to the legacy MediaUpload class component.
 * It provides a cleaner API and better integration with the WordPress block editor.
 *
 * @param props               Component props
 * @param props.allowedTypes  Array of allowed media types
 * @param props.multiple      Whether multiple files can be selected
 * @param props.value         Currently selected media item(s)
 * @param props.onSelect      Function called when media is selected
 * @param props.onClose       Function called when modal is closed
 * @param props.onUpload      Function to handle media uploads
 * @param props.title         Title for the modal
 * @param props.isOpen        Whether the modal is open
 * @param props.isDismissible Whether modal can be dismissed
 * @param props.modalClass    Additional CSS class for modal
 * @param props.search        Whether to show search input
 * @param props.searchLabel   Label for search input
 * @return JSX element or null
 */
export function MediaUploadModal( {
	allowedTypes,
	multiple = false,
	value,
	onSelect,
	onClose,
	onUpload,
	title = __( 'Select Media' ),
	isOpen,
	isDismissible = true,
	modalClass,
	search = true,
	searchLabel = __( 'Search media' ),
}: MediaUploadModalProps ) {
	const [ selection, setSelection ] = useState< string[] >( () => {
		if ( ! value ) {
			return [];
		}
		return Array.isArray( value )
			? value.map( String )
			: [ String( value ) ];
	} );

	const { createSuccessNotice, createErrorNotice, createInfoNotice } =
		useDispatch( noticesStore );
	// @ts-expect-error - invalidateResolution is not in the typed actions but is available at runtime
	const { invalidateResolution } = useDispatch( coreStore );

	// Transient upload items state
	const [ transientItems, setTransientItems ] = useState<
		TransientUploadItem[]
	>( [] );
	const nextClientIdRef = useRef( 0 );

	// Tracks the refetch lifecycle after uploads complete:
	// false → 'pending' (uploads done, waiting for refetch to start)
	// → 'loading' (refetch in progress) → false (done, transient items removed)
	const [ awaitingRefresh, setAwaitingRefresh ] = useState<
		false | 'pending' | 'loading'
	>( false );

	// DataViews configuration - allow view updates
	const [ view, setView ] = useState< View >( () => ( {
		type: LAYOUT_PICKER_GRID,
		fields: [],
		showTitle: false,
		titleField: 'title',
		mediaField: 'media_thumbnail',
		search: '',
		page: 1,
		perPage: 20,
		filters: [],
		layout: {
			previewSize: 170,
		},
	} ) );

	// Build query args based on view properties, similar to PostList
	const queryArgs = useMemo( () => {
		const filters: Record< string, any > = {};

		view.filters?.forEach( ( filter ) => {
			// Handle media type filters
			if ( filter.field === 'media_type' ) {
				filters.media_type = filter.value;
			}
			// Handle author filters
			if ( filter.field === 'author' ) {
				if ( filter.operator === 'isAny' ) {
					filters.author = filter.value;
				} else if ( filter.operator === 'isNone' ) {
					filters.author_exclude = filter.value;
				}
			}
			// Handle date filters
			if ( filter.field === 'date' || filter.field === 'modified' ) {
				if ( filter.operator === 'before' ) {
					filters.before = filter.value;
				} else if ( filter.operator === 'after' ) {
					filters.after = filter.value;
				}
			}
			// Handle mime type filters
			if ( filter.field === 'mime_type' ) {
				filters.mime_type = filter.value;
			}
		} );

		// Base media type on allowedTypes if no filter is set
		if ( ! filters.media_type ) {
			filters.media_type = allowedTypes?.includes( '*' )
				? undefined
				: allowedTypes;
		}

		return {
			per_page: view.perPage || 20,
			page: view.page || 1,
			status: 'inherit',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			_embed: 'author,wp:attached-to',
			...filters,
		};
	}, [ view, allowedTypes ] );

	// Fetch all media attachments using WordPress core data with permissions
	const {
		records: mediaRecords,
		isResolving: isLoading,
		totalItems,
		totalPages,
	} = useEntityRecordsWithPermissions( 'postType', 'attachment', queryArgs );

	// Compose transient upload items into the data array for DataViewsPicker.
	// Transient items are prepended so they appear at the top of the grid.
	const dataWithTransientItems = useMemo( () => {
		if ( transientItems.length === 0 ) {
			return mediaRecords || [];
		}

		const transientRecords = transientItems.map(
			( item ) =>
				( {
					id: item.clientId,
					slug: '',
					status: 'inherit',
					type: 'attachment',
					mime_type: item.file.type || 'application/octet-stream',
					source_url: '',
					title: {
						raw: item.file.name,
						rendered: item.file.name,
					},
					alt_text: '',
					caption: { rendered: '' },
					description: { rendered: '' },
					media_type: item.file.type?.startsWith( 'image/' )
						? 'image'
						: 'file',
					media_details: {},
					post: null,
					featured_media: 0,
					link: '',
					date: '',
					date_gmt: '',
					modified: '',
					modified_gmt: '',
					author: 0,
					comment_status: '',
					ping_status: '',
					meta: [],
					template: '',
					class_list: [],
					_links: {},
					_transientStatus: item.status,
				} ) as unknown as RestAttachment
		);

		return [ ...transientRecords, ...( mediaRecords || [] ) ];
	}, [ transientItems, mediaRecords ] );

	// Custom getItemId that handles both real and transient items.
	// Transient items use their clientId string; real items use their numeric ID.
	const getItemId = useCallback(
		( item: RestAttachment ) => String( item.id ),
		[]
	);

	// Filter selection changes to prevent selecting transient items.
	const handleSelectionChange = useCallback( ( newSelection: string[] ) => {
		setSelection(
			newSelection.filter(
				( id ) => ! id.startsWith( TRANSIENT_ID_PREFIX )
			)
		);
	}, [] );

	// Fields with transient-aware thumbnail rendering
	const fields: Field< RestAttachment >[] = useMemo( () => {
		const OriginalThumbnailRender = mediaThumbnailField.render;
		return [
			{
				...( mediaThumbnailField as Field< RestAttachment > ),
				enableHiding: false,
				render: function TransientAwareThumbnail(
					props: DataViewRenderFieldProps< RestAttachment >
				) {
					const transientStatus = (
						props.item as RestAttachment & {
							_transientStatus?: string;
						}
					 )._transientStatus;
					if ( transientStatus ) {
						return (
							<UploadingThumbnailView
								filename={
									props.item.title?.raw ||
									props.item.title?.rendered ||
									''
								}
								isComplete={ transientStatus === 'complete' }
							/>
						);
					}
					if ( OriginalThumbnailRender ) {
						return (
							<OriginalThumbnailRender { ...( props as any ) } />
						);
					}
					return null;
				},
			},
			{
				id: 'title',
				type: 'text' as const,
				label: __( 'Title' ),
				getValue: ( { item }: { item: RestAttachment } ) => {
					const titleValue = item.title.raw || item.title.rendered;
					return titleValue || __( '(no title)' );
				},
			},
			altTextField as Field< RestAttachment >,
			captionField as Field< RestAttachment >,
			descriptionField as Field< RestAttachment >,
			dateAddedField as Field< RestAttachment >,
			dateModifiedField as Field< RestAttachment >,
			authorField as Field< RestAttachment >,
			filenameField as Field< RestAttachment >,
			filesizeField as Field< RestAttachment >,
			mediaDimensionsField as Field< RestAttachment >,
			mimeTypeField as Field< RestAttachment >,
			attachedToField as Field< RestAttachment >,
		];
	}, [] );

	const actions: ActionButton< RestAttachment >[] = useMemo(
		() => [
			{
				id: 'select',
				label: multiple ? __( 'Select' ) : __( 'Select' ),
				isPrimary: true,
				supportsBulk: multiple,
				async callback() {
					if ( selection.length === 0 ) {
						return;
					}

					const selectedPostsQuery = {
						include: selection,
						per_page: -1,
					};

					const selectedPosts = await resolveSelect(
						coreStore
					).getEntityRecords< RestAttachment >(
						'postType',
						'attachment',
						selectedPostsQuery
					);

					// Transform the selected posts to the expected Attachment format
					const transformedPosts = ( selectedPosts ?? [] )
						.map( transformAttachment )
						.filter( Boolean );

					const selectedItems = multiple
						? transformedPosts
						: transformedPosts?.[ 0 ];

					onSelect( selectedItems );
				},
			},
		],
		[ multiple, onSelect, selection ]
	);

	const handleModalClose = useCallback( () => {
		onClose?.();
	}, [ onClose ] );

	// Use onUpload if provided, otherwise fall back to uploadMedia
	const handleUpload = onUpload || uploadMedia;

	// Initiate an upload with transient item tracking.
	// Creates transient items for visual feedback, starts the upload,
	// and handles completion/error by updating transient item state.
	const initiateUpload = useCallback(
		( files: File[] ) => {
			// Create transient items for each file
			const clientIds: string[] = [];
			const newItems: TransientUploadItem[] = files.map( ( file ) => {
				const clientId = `${ TRANSIENT_ID_PREFIX }${ nextClientIdRef.current++ }`;
				clientIds.push( clientId );
				return { clientId, file, status: 'uploading' as const };
			} );

			setTransientItems( ( prev ) => [ ...newItems, ...prev ] );

			// Show uploading notice (important for screen reader announcements)
			createInfoNotice(
				sprintf(
					// translators: %s: number of files
					_n(
						'Uploading %s file',
						'Uploading %s files',
						files.length
					),
					files.length.toLocaleString()
				),
				{
					type: 'snackbar',
					context: NOTICES_CONTEXT,
					id: NOTICE_ID_UPLOAD_PROGRESS,
					explicitDismiss: true,
				}
			);

			handleUpload( {
				allowedTypes,
				filesList: files,
				onFileChange: ( attachments: Partial< Attachment >[] ) => {
					if ( ! attachments ) {
						return;
					}

					// Check if all uploads in this batch are complete
					const allComplete = attachments.every(
						( attachment ) =>
							attachment &&
							attachment.id &&
							attachment.url &&
							! isBlobURL( attachment.url )
					);

					if ( allComplete && attachments.length > 0 ) {
						// Mark transient items in this batch as complete
						setTransientItems( ( prev ) =>
							prev.map( ( item ) => {
								if (
									clientIds.includes( item.clientId ) &&
									item.status === 'uploading'
								) {
									return {
										...item,
										status: 'complete' as const,
									};
								}
								return item;
							} )
						);

						// Show success notice
						createSuccessNotice(
							sprintf(
								// translators: %s: number of files
								_n(
									'Uploaded %s file',
									'Uploaded %s files',
									attachments.length
								),
								attachments.length.toLocaleString()
							),
							{
								type: 'snackbar',
								context: NOTICES_CONTEXT,
								id: NOTICE_ID_UPLOAD_PROGRESS,
							}
						);

						// Auto-select the newly uploaded items
						const uploadedIds = attachments
							.map( ( attachment ) => String( attachment.id ) )
							.filter( Boolean );

						if ( multiple ) {
							setSelection( ( prev ) => [
								...prev,
								...uploadedIds,
							] );
						} else {
							setSelection( uploadedIds.slice( 0, 1 ) );
						}

						// Invalidate resolution to refresh data
						invalidateResolution( 'getEntityRecords', [
							'postType',
							'attachment',
							queryArgs,
						] );

						// Reset view to page 1 so the new item is visible
						setView( ( prev ) => ( {
							...prev,
							page: 1,
							search: '',
						} ) );

						// Start awaiting refetch to remove transient items
						setAwaitingRefresh( 'pending' );
					}
				},
				onError: ( error: Error ) => {
					// Remove the failed transient item by matching the File reference
					const uploadError = error as Error & {
						file?: File;
					};
					if ( uploadError.file ) {
						setTransientItems( ( prev ) =>
							prev.filter(
								( item ) =>
									! (
										clientIds.includes( item.clientId ) &&
										item.file === uploadError.file
									)
							)
						);
					}

					// Show error notice
					createErrorNotice( error.message, {
						type: 'snackbar',
						context: NOTICES_CONTEXT,
						id: NOTICE_ID_UPLOAD_PROGRESS,
					} );
				},
			} );
		},
		[
			allowedTypes,
			handleUpload,
			createInfoNotice,
			createSuccessNotice,
			createErrorNotice,
			invalidateResolution,
			queryArgs,
			multiple,
		]
	);

	// Remove complete transient items after the data refetch completes.
	// Two-phase detection: wait for isLoading to become true (refetch started),
	// then wait for it to become false (refetch done).
	useEffect( () => {
		if ( awaitingRefresh === 'pending' && isLoading ) {
			setAwaitingRefresh( 'loading' );
		} else if ( awaitingRefresh === 'loading' && ! isLoading ) {
			setTransientItems( ( prev ) =>
				prev.filter( ( item ) => item.status !== 'complete' )
			);
			setAwaitingRefresh( false );
		}
	}, [ awaitingRefresh, isLoading ] );

	// Fallback: remove complete transient items after a timeout in case
	// the refetch lifecycle doesn't trigger as expected.
	useEffect( () => {
		if ( ! awaitingRefresh ) {
			return;
		}
		const timeout = setTimeout( () => {
			setTransientItems( ( prev ) =>
				prev.filter( ( item ) => item.status !== 'complete' )
			);
			setAwaitingRefresh( false );
		}, 3000 );
		return () => clearTimeout( timeout );
	}, [ awaitingRefresh ] );

	const handleFileSelect = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			const files = event.target.files;
			if ( files && files.length > 0 ) {
				initiateUpload( Array.from( files ) );
			}
		},
		[ initiateUpload ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems,
			totalPages,
		} ),
		[ totalItems, totalPages ]
	);

	const defaultLayouts = useMemo(
		() => ( {
			[ LAYOUT_PICKER_GRID ]: {
				fields: [],
				showTitle: false,
			},
			[ LAYOUT_PICKER_TABLE ]: {
				fields: [
					'filename',
					'filesize',
					'media_dimensions',
					'author',
					'date',
				],
				showTitle: true,
			},
		} ),
		[]
	);

	// Build accept attribute from allowedTypes
	const acceptTypes = useMemo( () => {
		if ( allowedTypes?.includes( '*' ) ) {
			return undefined;
		}
		return allowedTypes?.join( ',' );
	}, [ allowedTypes ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ title }
			onRequestClose={ handleModalClose }
			isDismissible={ isDismissible }
			className={ modalClass }
			overlayClassName="media-upload-modal"
			size="fill"
			headerActions={
				<FormFileUpload
					accept={ acceptTypes }
					multiple
					onChange={ handleFileSelect }
					__next40pxDefaultSize
					render={ ( { openFileDialog } ) => (
						<Button
							onClick={ openFileDialog }
							icon={ uploadIcon }
							__next40pxDefaultSize
						>
							{ __( 'Upload media' ) }
						</Button>
					) }
				/>
			}
		>
			<DropZone
				onFilesDrop={ ( files ) => {
					let filteredFiles = files;
					// Filter files by allowed types if specified
					if ( allowedTypes && ! allowedTypes.includes( '*' ) ) {
						filteredFiles = files.filter( ( file ) =>
							allowedTypes.some( ( allowedType ) => {
								// Check if the file type matches the allowed MIME type
								return (
									file.type === allowedType ||
									file.type.startsWith(
										allowedType.replace( '*', '' )
									)
								);
							} )
						);
					}
					if ( filteredFiles.length > 0 ) {
						initiateUpload( filteredFiles );
					}
				} }
				label={ __( 'Drop files to upload' ) }
			/>
			<DataViewsPicker
				data={ dataWithTransientItems }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				selection={ selection }
				onChangeSelection={ handleSelectionChange }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
				getItemId={ getItemId }
				search={ search }
				searchLabel={ searchLabel }
				itemListLabel={ __( 'Media items' ) }
			/>
			<SnackbarNotices
				className="media-upload-modal__snackbar"
				context={ NOTICES_CONTEXT }
			/>
		</Modal>
	);
}

export default MediaUploadModal;
