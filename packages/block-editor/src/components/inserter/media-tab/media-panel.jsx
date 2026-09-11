import { Button } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useDebouncedInput, usePrevious } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as noticesStore } from '@wordpress/notices';
// There is no folder icon in the library; the category one is the closest.
import { external, linkOff, category as folderIcon } from '@wordpress/icons';
import MediaGrid from './media-grid';
import FolderSelect from './folder-select';
import NewFolderModal from './new-folder-modal';
import MediaUpload from '../../media-upload';
import MediaUploadCheck from '../../media-upload/check';
import { useMediaResults } from './hooks';
import InserterNoResults from '../no-results';

// Four rows at the grid's two columns: roughly one screen of the open panel,
// so a page is browsed with little scrolling and the pager does the rest.
const MEDIA_ITEMS_PER_PAGE = 8;

// The attach flow is image-only, so the picker is constrained to images.
const ATTACH_ALLOWED_TYPES = [ 'image' ];

/**
 * Opens the Media Library to pick items for the panel's footer action: attaching
 * images to the current post, or filing items into the selected folder.
 *
 * The picker opens fresh each time with no pre-selected value, so it is purely
 * additive: selecting items adds them, and it does not imply that deselecting
 * would remove them. Removing is a separate, explicit per-item action.
 *
 * @param {Object}   props
 * @param {string}   props.label        The button label, also the picker's title.
 * @param {string[]} props.allowedTypes The media types the picker offers.
 * @param {Function} props.onSelect     Called with the selected media items.
 */
function MediaPickerButton( { label, allowedTypes, onSelect } ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				multiple="add"
				onSelect={ onSelect }
				allowedTypes={ allowedTypes }
				title={ label }
				render={ ( { open } ) => (
					<Button
						__next40pxDefaultSize
						className="block-editor-inserter__media-panel-attach"
						data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
						onClick={ ( event ) => {
							event.target.focus();
							open();
						} }
						variant="secondary"
					>
						{ label }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}

/**
 * The body of the "Detach" action's confirmation modal.
 *
 * @param {Object}   props
 * @param {string}   [props.postTypeLabel] Name of the post type, e.g. "Page".
 * @param {Function} props.onCancel
 * @param {Function} props.onConfirm
 */
function DetachConfirmation( { postTypeLabel, onCancel, onConfirm } ) {
	return (
		<>
			<p>
				{ postTypeLabel
					? sprintf(
							/* translators: %s: Name of the post type e.g: "Page". */
							__(
								'Detach this image from the current %s? The image will remain in the Media Library.'
							),
							postTypeLabel
					  )
					: __(
							'Detach this image from the current post? The image will remain in the Media Library.'
					  ) }
			</p>
			<div className="block-editor-inserter__media-panel-detach-actions">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onCancel }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ onConfirm }
				>
					{ __( 'Detach' ) }
				</Button>
			</div>
		</>
	);
}

/**
 * The body of the "Add to folder…" action's modal: pick the destination.
 *
 * @param {Object}   props
 * @param {Object[]} props.folders
 * @param {Function} props.onCancel
 * @param {Function} props.onConfirm Called with the chosen folder's id.
 */
function AddToFolderPicker( { folders, onCancel, onConfirm } ) {
	const [ folderId, setFolderId ] = useState();
	return (
		<>
			<FolderSelect
				folders={ folders }
				value={ folderId }
				onChange={ setFolderId }
				includeAll={ false }
				showLabel
			/>
			<div className="block-editor-inserter__media-panel-detach-actions">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onCancel }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					disabled={ folderId === undefined }
					accessibleWhenDisabled
					onClick={ () => onConfirm( folderId ) }
				>
					{ __( 'Add' ) }
				</Button>
			</div>
		</>
	);
}

/**
 * @param {Object}   props
 * @param {Function} props.onInsert       Called with the block to insert.
 * @param {Object}   props.category       The media source.
 * @param {Object}   [props.mediaFolders] The host editor's media folders capability, when available.
 */
export function MediaCategoryPanel( { onInsert, category, mediaFolders } ) {
	// The grid's search input debounces on its own, so the panel queries with
	// the value it hands over as-is.
	const [ search, setSearch ] = useDebouncedInput();
	const [ page, setPage ] = useState( 1 );
	// The selected folder's id, or `undefined` for all. Only meaningful for a
	// source that supports folders while the host editor supplies them.
	const [ folder, setFolder ] = useState();
	const folders =
		mediaFolders && category.supportsFolders
			? mediaFolders.folders
			: undefined;
	// Reset paging (and the folder) whenever the source category changes, and
	// paging whenever the search term or folder changes. Adjusting state during
	// render (rather than in an effect) keeps the query on page 1 for the very
	// next fetch, avoiding a wasted request for the previous page. Mirrors
	// `usePatternsPaging`.
	const previousCategory = usePrevious( category.name );
	const previousSearch = usePrevious( search );
	const previousFolder = usePrevious( folder );
	if ( previousCategory !== category.name && folder !== undefined ) {
		setFolder( undefined );
	}
	if (
		( previousCategory !== category.name ||
			previousSearch !== search ||
			previousFolder !== folder ) &&
		page !== 1
	) {
		setPage( 1 );
	}
	// A folder deleted elsewhere (or folders going away) leaves nothing to
	// filter by.
	if (
		folder !== undefined &&
		! folders?.some( ( { id } ) => id === folder )
	) {
		setFolder( undefined );
	}
	const query = useMemo(
		() => ( {
			per_page: MEDIA_ITEMS_PER_PAGE,
			page,
			search,
			folder,
		} ),
		[ page, search, folder ]
	);
	const [ refreshKey, setRefreshKey ] = useState( 0 );
	const { mediaList, isLoading, totalItems, totalPages } = useMediaResults(
		category,
		query,
		refreshKey
	);
	const numPages = totalPages || 1;
	// If the current set shrinks below the active page (e.g. detaching images
	// empties the last page), clamp back into range so the grid isn't left blank
	// on a page that no longer exists.
	if ( typeof totalPages === 'number' && page > numPages ) {
		setPage( numPages );
	}
	// Private to core's media categories, these capabilities act on WordPress
	// attachments:
	// - `attach`/`detach`/`invalidate` manage the images attached to this post.
	// - `assignToFolder`/`removeFromFolder` file them into media folders.
	// - `subscribe` watches the attachment cache backing them.
	// An external resource can never own a post's attachments, and every category
	// registered by an extender through the public `registerInserterMediaCategory`
	// API is flagged as one — so this guard stops such a category from opting into
	// the workflow just by setting these props.
	const supportsAttachments = ! category.isExternalResource;
	const attach = supportsAttachments ? category.attach : undefined;
	const detach = supportsAttachments ? category.detach : undefined;
	const subscribe = supportsAttachments ? category.subscribe : undefined;
	const assignToFolder =
		supportsAttachments && folders ? category.assignToFolder : undefined;
	const selectedFolder = folders?.find( ( { id } ) => id === folder );
	const selectedFolderName = selectedFolder
		? decodeEntities( selectedFolder.name )
		: undefined;

	const panelRef = useRef();
	const changePage = useCallback( ( nextPage ) => {
		// The grid's layout container is the scroll host; start the new page
		// from the top rather than wherever the previous one was scrolled to.
		panelRef.current
			?.querySelector( '.dataviews-layout__container' )
			?.scrollTo?.( 0, 0 );
		setPage( nextPage );
	}, [] );
	const { createErrorNotice, createSuccessNotice, createWarningNotice } =
		useDispatch( noticesStore );

	// Invalidate the cached results and force `useMediaResults` to refetch so
	// the grid reflects images that were just attached, detached or filed.
	const refresh = useCallback( () => {
		if ( supportsAttachments ) {
			category.invalidate?.( query );
		}
		setRefreshKey( ( key ) => key + 1 );
	}, [ category, query, supportsAttachments ] );

	// A media modal opened anywhere in the editor (a canvas block, the featured
	// image panel, the "Attach images" button) attaches its uploads to the current
	// post, and invalidates the cached attachment queries when it closes. Refetch
	// so the grid reflects the newly attached images.
	useEffect( () => {
		if ( ! subscribe ) {
			return;
		}
		return subscribe( () => setRefreshKey( ( key ) => key + 1 ), query );
	}, [ subscribe, query ] );

	const handleAttach = useCallback(
		async ( selectedMedia ) => {
			try {
				const attachedCount = await attach( selectedMedia );

				if ( ! attachedCount ) {
					// This source only attaches images (the picker's "Upload
					// files" tab otherwise accepts any file type), so a selection
					// with no images attaches nothing.
					createWarningNotice( __( 'No images were attached.' ), {
						type: 'snackbar',
						id: 'inserter-notice',
					} );
					return;
				}

				refresh();
				createSuccessNotice(
					category.postTypeLabel
						? sprintf(
								/* translators: %1$d: Number of images attached. %2$s: Name of the post type e.g: "Page". */
								_n(
									'%1$d image attached to %2$s.',
									'%1$d images attached to %2$s.',
									attachedCount
								),
								attachedCount,
								category.postTypeLabel
						  )
						: sprintf(
								/* translators: %d: Number of images attached to the post. */
								_n(
									'%d image attached to post.',
									'%d images attached to post.',
									attachedCount
								),
								attachedCount
						  ),
					{ type: 'snackbar', id: 'inserter-notice' }
				);
			} catch {
				createErrorNotice( __( 'Could not attach images.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			}
		},
		[
			attach,
			category,
			refresh,
			createErrorNotice,
			createSuccessNotice,
			createWarningNotice,
		]
	);

	const handleDetach = useCallback(
		async ( media ) => {
			try {
				await detach( media );
				refresh();
				createSuccessNotice(
					category.postTypeLabel
						? sprintf(
								/* translators: %s: Name of the post type e.g: "Page". */
								__( 'Image detached from %s.' ),
								category.postTypeLabel
						  )
						: __( 'Image detached from post.' ),
					{ type: 'snackbar', id: 'inserter-notice' }
				);
			} catch {
				createErrorNotice( __( 'Could not detach image.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			}
		},
		[ detach, category, refresh, createErrorNotice, createSuccessNotice ]
	);

	const getFolderName = useCallback(
		( folderId ) => {
			const match = folders?.find( ( { id } ) => id === folderId );
			return match ? decodeEntities( match.name ) : '';
		},
		[ folders ]
	);

	// Files items into a folder: the picker's selection into the selected
	// folder, or one card into the folder chosen in the action's modal.
	const addToFolder = useCallback(
		async ( mediaItems, folderId ) => {
			try {
				const addedCount = await assignToFolder( mediaItems, folderId );

				if ( ! addedCount ) {
					// The picker's "Upload files" tab accepts any file type, so
					// a selection can hold nothing of this source's type.
					createWarningNotice( __( 'No items were added.' ), {
						type: 'snackbar',
						id: 'inserter-notice',
					} );
					return;
				}

				refresh();
				createSuccessNotice(
					sprintf(
						/* translators: %1$d: Number of items added. %2$s: Name of the folder. */
						_n(
							'%1$d item added to %2$s.',
							'%1$d items added to %2$s.',
							addedCount
						),
						addedCount,
						getFolderName( folderId )
					),
					{ type: 'snackbar', id: 'inserter-notice' }
				);
			} catch {
				createErrorNotice( __( 'Could not add items to the folder.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			}
		},
		[
			assignToFolder,
			getFolderName,
			refresh,
			createErrorNotice,
			createSuccessNotice,
			createWarningNotice,
		]
	);
	const handleAddToFolder = useCallback(
		( selectedMedia ) => addToFolder( selectedMedia, folder ),
		[ addToFolder, folder ]
	);

	const removeFromFolder =
		supportsAttachments && folders ? category.removeFromFolder : undefined;
	const handleRemoveFromFolder = useCallback(
		async ( media ) => {
			try {
				await removeFromFolder( media, folder );
				refresh();
				createSuccessNotice(
					sprintf(
						/* translators: %s: Name of the folder. */
						__( 'Item removed from %s.' ),
						selectedFolderName
					),
					{ type: 'snackbar', id: 'inserter-notice' }
				);
			} catch {
				createErrorNotice(
					__( 'Could not remove the item from the folder.' ),
					{ type: 'snackbar', id: 'inserter-notice' }
				);
			}
		},
		[
			removeFromFolder,
			folder,
			selectedFolderName,
			refresh,
			createErrorNotice,
			createSuccessNotice,
		]
	);

	const [ isCreatingFolder, setIsCreatingFolder ] = useState( false );
	const onFolderCreated = useCallback( ( newFolder ) => {
		setIsCreatingFolder( false );
		// Land in the new, empty folder so items can be added to it straight
		// away. The host's folder list updates on its own.
		setFolder( newFolder?.id );
	}, [] );

	// Per-item actions for the grid's card menu. None supports bulk, so the
	// grid renders no selection checkboxes.
	const actions = useMemo( () => {
		const list = [];
		if ( category.getReportUrl ) {
			list.push( {
				id: 'report',
				label: sprintf(
					/* translators: %s: The media type to report e.g: "image", "video", "audio" */
					__( 'Report %s' ),
					category.mediaType
				),
				icon: external,
				callback: ( [ media ] ) => {
					window
						.open( category.getReportUrl( media ), '_blank' )
						.focus();
				},
			} );
		}
		if ( detach ) {
			list.push( {
				id: 'detach',
				label: category.postTypeLabel
					? sprintf(
							/* translators: %s: Name of the post type e.g: "Page". */
							__( 'Detach from %s' ),
							category.postTypeLabel
					  )
					: __( 'Detach from post' ),
				icon: linkOff,
				modalHeader: __( 'Detach image' ),
				// Detaching is confirmed in the action's modal before it takes
				// effect.
				RenderModal: ( { items, closeModal } ) => (
					<DetachConfirmation
						postTypeLabel={ category.postTypeLabel }
						onCancel={ closeModal }
						onConfirm={ () => {
							closeModal?.();
							handleDetach( items[ 0 ] );
						} }
					/>
				),
			} );
		}
		if ( assignToFolder && folders.length ) {
			list.push( {
				id: 'add-to-folder',
				label: __( 'Add to folder…' ),
				icon: folderIcon,
				modalHeader: __( 'Add to folder' ),
				RenderModal: ( { items, closeModal } ) => (
					<AddToFolderPicker
						folders={ folders }
						onCancel={ closeModal }
						onConfirm={ ( folderId ) => {
							closeModal?.();
							addToFolder( items, folderId );
						} }
					/>
				),
			} );
		}
		if ( removeFromFolder && selectedFolder ) {
			list.push( {
				id: 'remove-from-folder',
				label: __( 'Remove from folder' ),
				icon: folderIcon,
				// Reversible by adding the item again, so no confirmation.
				callback: ( [ media ] ) => handleRemoveFromFolder( media ),
			} );
		}
		return list;
	}, [
		category,
		detach,
		handleDetach,
		assignToFolder,
		folders,
		addToFolder,
		removeFromFolder,
		selectedFolder,
		handleRemoveFromFolder,
	] );

	const searchLabel = category.labels.search_items || __( 'Search' );
	let emptyMessage = __( 'No results found.' );
	if ( ! search && selectedFolder ) {
		emptyMessage = __( 'This folder is empty.' );
	} else if ( ! search && category.emptyMessage ) {
		// For a source with a custom empty message (e.g. Attachments) and no
		// active search, an empty result means nothing is attached yet —
		// clearer than the generic "no results found".
		emptyMessage = category.emptyMessage;
	}

	let footer;
	if ( selectedFolder && assignToFolder ) {
		footer = (
			<MediaPickerButton
				label={ __( 'Add to folder' ) }
				allowedTypes={ [ category.mediaType ] }
				onSelect={ handleAddToFolder }
			/>
		);
	} else if ( attach ) {
		footer = (
			<MediaPickerButton
				label={ __( 'Attach images' ) }
				allowedTypes={ ATTACH_ALLOWED_TYPES }
				onSelect={ handleAttach }
			/>
		);
	}

	return (
		<div ref={ panelRef } className="block-editor-inserter__media-panel">
			<MediaGrid
				mediaList={ mediaList }
				isLoading={ isLoading }
				totalItems={ totalItems }
				totalPages={ totalPages }
				page={ page }
				perPage={ MEDIA_ITEMS_PER_PAGE }
				onChangePage={ changePage }
				search={ search }
				onChangeSearch={ setSearch }
				category={ category }
				onInsert={ onInsert }
				actions={ actions }
				searchLabel={ searchLabel }
				filters={
					folders && (
						<FolderSelect
							folders={ folders }
							value={ folder }
							onChange={ setFolder }
							onCreate={
								mediaFolders.canCreate
									? () => setIsCreatingFolder( true )
									: undefined
							}
						/>
					)
				}
				empty={
					<InserterNoResults>{ emptyMessage }</InserterNoResults>
				}
				footer={ footer }
			/>
			{ isCreatingFolder && (
				<NewFolderModal
					create={ mediaFolders.create }
					onCreated={ onFolderCreated }
					onClose={ () => setIsCreatingFolder( false ) }
				/>
			) }
		</div>
	);
}
