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
import { store as noticesStore } from '@wordpress/notices';
import { external, linkOff } from '@wordpress/icons';
import MediaGrid from './media-grid';
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
 * Opens the Media Library to attach images to the current post. Only rendered
 * for media categories that expose an `attach` capability (i.e. the "Attached
 * images" source); other sources render the panel exactly as before.
 *
 * The picker opens fresh each time with no pre-selected value, so it is purely
 * additive: selecting images attaches them, and it does not imply that
 * deselecting would detach. Detaching is a separate, explicit per-item action.
 *
 * @param {Object}   props
 * @param {Function} props.onSelect Called with the selected media items.
 */
function AttachImagesButton( { onSelect } ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				multiple="add"
				onSelect={ onSelect }
				allowedTypes={ ATTACH_ALLOWED_TYPES }
				title={ __( 'Attach images' ) }
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
						{ __( 'Attach images' ) }
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

export function MediaCategoryPanel( { onInsert, category } ) {
	// The grid's search input debounces on its own, so the panel queries with
	// the value it hands over as-is.
	const [ search, setSearch ] = useDebouncedInput();
	const [ page, setPage ] = useState( 1 );
	// Reset paging whenever the source category or the search term changes.
	// Adjusting state during render (rather than in an effect) keeps the query
	// on page 1 for the very next fetch, avoiding a wasted request for the
	// previous page. Mirrors `usePatternsPaging`.
	const previousCategory = usePrevious( category.name );
	const previousSearch = usePrevious( search );
	if (
		( previousCategory !== category.name || previousSearch !== search ) &&
		page !== 1
	) {
		setPage( 1 );
	}
	const query = useMemo(
		() => ( {
			per_page: MEDIA_ITEMS_PER_PAGE,
			page,
			search,
		} ),
		[ page, search ]
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
	// - `subscribe` watches the attachment cache backing them.
	// An external resource can never own a post's attachments, and every category
	// registered by an extender through the public `registerInserterMediaCategory`
	// API is flagged as one — so this guard stops such a category from opting into
	// the workflow just by setting these props.
	const supportsAttachments = ! category.isExternalResource;
	const attach = supportsAttachments ? category.attach : undefined;
	const detach = supportsAttachments ? category.detach : undefined;
	const subscribe = supportsAttachments ? category.subscribe : undefined;

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
	// the grid reflects images that were just attached or detached.
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
		return list;
	}, [ category, detach, handleDetach ] );

	const searchLabel = category.labels.search_items || __( 'Search' );
	const emptyMessage =
		category.emptyMessage && ! search
			? // For a source with a custom empty message (e.g. Attachments)
			  // and no active search, an empty result means nothing is
			  // attached yet — clearer than the generic "no results found".
			  category.emptyMessage
			: __( 'No results found.' );

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
				empty={
					<InserterNoResults>{ emptyMessage }</InserterNoResults>
				}
				footer={
					attach && <AttachImagesButton onSelect={ handleAttach } />
				}
			/>
		</div>
	);
}
