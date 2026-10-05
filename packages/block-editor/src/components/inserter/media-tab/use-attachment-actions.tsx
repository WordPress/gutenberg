import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { external, linkOff } from '@wordpress/icons';
import DetachConfirmation from './detach-confirmation';

/**
 * The attach/detach workflow for a media source.
 *
 * Owns the capabilities a core media category exposes, the notices they raise,
 * and the refresh key that pulls fresh results once an attachment changes. The
 * panel wires the results up: `actions` to the grid, `handleAttach` to the
 * attach button, and `refreshKey` to the results hook.
 *
 * Sources without these capabilities (Openverse, anything registered through
 * the public API) get an empty action list and an inert refresh key.
 */
export function useAttachmentActions( { category, query } ) {
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

	const [ refreshKey, setRefreshKey ] = useState( 0 );
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

	return { actions, attach, handleAttach, refreshKey };
}
