/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	privateApis as coreDataPrivateApis,
	store as coreStore,
} from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';
import { Modal, DropZone, FormFileUpload, Button } from '@wordpress/components';
import { upload as uploadIcon } from '@wordpress/icons';
import { DataViewsPicker } from '@wordpress/dataviews';
import type { View, Field, ActionButton } from '@wordpress/dataviews';
import {
	altTextField,
	captionField,
	descriptionField,
	filenameField,
	filesizeField,
	mediaDimensionsField,
	mediaThumbnailField,
	mimeTypeField,
} from '@wordpress/media-fields';

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

interface MediaUploadModalProps {
	/**
	 * Array of allowed media types.
	 * @default ['image']
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
	allowedTypes = [ 'image' ],
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
				filters.author = filter.value;
			}
			// Handle date filters
			if ( filter.field === 'date' ) {
				filters.after = filter.value?.after;
				filters.before = filter.value?.before;
			}
			// Handle mime type filters
			if ( filter.field === 'mime_type' ) {
				filters.mime_type = filter.value;
			}
		} );

		// Base media type on allowedTypes if no filter is set
		if ( ! filters.media_type ) {
			filters.media_type = allowedTypes.includes( '*' )
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

	const fields: Field< RestAttachment >[] = useMemo(
		() => [
			{
				id: 'title',
				type: 'text' as const,
				label: __( 'Title' ),
				getValue: ( { item }: { item: RestAttachment } ) => {
					const titleValue = item.title.raw || item.title.rendered;
					return titleValue || __( '(no title)' );
				},
			},
			// Media field definitions from @wordpress/media-fields
			// Cast is safe because RestAttachment has the same properties as Attachment
			mediaThumbnailField as Field< RestAttachment >,
			altTextField as Field< RestAttachment >,
			captionField as Field< RestAttachment >,
			descriptionField as Field< RestAttachment >,
			filenameField as Field< RestAttachment >,
			filesizeField as Field< RestAttachment >,
			mediaDimensionsField as Field< RestAttachment >,
			mimeTypeField as Field< RestAttachment >,
		],
		[]
	);

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
					).getEntityRecords(
						'postType',
						'attachment',
						selectedPostsQuery
					);

					// Transform the selected posts to the expected Attachment format
					const transformedPosts =
						selectedPosts?.map( transformAttachment );

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

	const handleFileSelect = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			const files = event.target.files;
			if ( files && files.length > 0 ) {
				const filesArray = Array.from( files );
				handleUpload( {
					allowedTypes,
					filesList: filesArray,
				} );
			}
		},
		[ allowedTypes, handleUpload ]
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
				fields: [ 'filename', 'filesize', 'media_dimensions' ],
				showTitle: true,
			},
		} ),
		[]
	);

	// Build accept attribute from allowedTypes
	const acceptTypes = useMemo( () => {
		if ( allowedTypes.includes( '*' ) ) {
			return undefined;
		}
		return allowedTypes.join( ',' );
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
						handleUpload( {
							allowedTypes,
							filesList: filteredFiles,
						} );
					}
				} }
				label={ __( 'Drop files to upload' ) }
			/>
			<DataViewsPicker
				data={ mediaRecords || [] }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				selection={ selection }
				onChangeSelection={ setSelection }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ defaultLayouts }
				getItemId={ ( item: RestAttachment ) => String( item.id ) }
				search={ search }
				searchLabel={ searchLabel }
				itemListLabel={ __( 'Media items' ) }
			/>
		</Modal>
	);
}

export default MediaUploadModal;
