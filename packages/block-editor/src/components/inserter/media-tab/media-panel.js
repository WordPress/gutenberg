/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Button, Modal, Spinner, SearchControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { useDebouncedInput } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import MediaList from './media-list';
import MediaUpload from '../../media-upload';
import MediaUploadCheck from '../../media-upload/check';
import { useMediaResults, useDelayedLoading } from './hooks';
import InserterNoResults from '../no-results';

const INITIAL_MEDIA_ITEMS_PER_PAGE = 10;

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

export function MediaCategoryPanel( { rootClientId, onInsert, category } ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput();
	const query = useMemo(
		() => ( {
			per_page: !! debouncedSearch ? 20 : INITIAL_MEDIA_ITEMS_PER_PAGE,
			search: debouncedSearch,
		} ),
		[ debouncedSearch ]
	);
	const [ refreshKey, setRefreshKey ] = useState( 0 );
	const { mediaList, isLoading } = useMediaResults(
		category,
		query,
		refreshKey
	);
	const { createErrorNotice, createSuccessNotice, createWarningNotice } =
		useDispatch( noticesStore );
	// Dim (rather than blank) the populated grid while a refetch is in flight,
	// but only once it has run long enough to be worth signalling — quick
	// attach/detach refetches resolve before this and show nothing.
	const showRefreshing = useDelayedLoading( isLoading );

	// Invalidate the cached results and force `useMediaResults` to refetch so
	// the grid reflects images that were just attached or detached.
	const refresh = useCallback( () => {
		category.invalidate?.( query );
		setRefreshKey( ( key ) => key + 1 );
	}, [ category, query ] );

	const handleAttach = useCallback(
		async ( selectedMedia ) => {
			try {
				const attachedCount = await category.attach( selectedMedia );

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
				await category.detach( media );
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
		[ category, refresh, createErrorNotice, createSuccessNotice ]
	);

	// Detaching is confirmed first: the dropdown sets the pending item, which
	// opens a modal, and only `confirmDetach` performs the detach.
	const [ mediaPendingDetach, setMediaPendingDetach ] = useState();
	const confirmDetach = useCallback( () => {
		const media = mediaPendingDetach;
		setMediaPendingDetach( undefined );
		handleDetach( media );
	}, [ handleDetach, mediaPendingDetach ] );

	const baseCssClass = 'block-editor-inserter__media-panel';
	const searchLabel = category.labels.search_items || __( 'Search' );
	return (
		<div
			className={ clsx( baseCssClass, {
				// The attach footer supplies the breathing room beneath the
				// grid, so the list drops its own bottom padding (see styles).
				'has-attach-footer': !! category.attach,
			} ) }
		>
			<SearchControl
				className={ `${ baseCssClass }-search` }
				onChange={ setSearch }
				value={ search }
				label={ searchLabel }
				placeholder={ searchLabel }
			/>
			{ isLoading && ! mediaList?.length && (
				<div className={ `${ baseCssClass }-spinner` }>
					<Spinner />
				</div>
			) }
			{ ! isLoading && ! mediaList?.length && (
				<InserterNoResults>
					{ category.emptyMessage && ! debouncedSearch
						? // For a source with a custom empty message (e.g.
						  // Attachments) and no active search, an empty result
						  // means nothing is attached yet — clearer than the
						  // generic "no results found".
						  category.emptyMessage
						: __( 'No results found.' ) }
				</InserterNoResults>
			) }
			{ !! mediaList?.length && (
				// Keep the existing items visible while a refetch is in flight,
				// dimming (and gently pulsing) them rather than clearing the grid,
				// so it doesn't flicker or pop.
				<div
					className={ clsx( `${ baseCssClass }-results`, {
						'is-loading': showRefreshing,
					} ) }
					aria-busy={ showRefreshing }
				>
					<MediaList
						rootClientId={ rootClientId }
						onClick={ onInsert }
						onDetach={
							category.detach ? setMediaPendingDetach : undefined
						}
						mediaList={ mediaList }
						category={ category }
					/>
				</div>
			) }
			{ category.attach && (
				// Pinned to the bottom of the panel as a fixed footer so it lines
				// up with the "Open Media Library" button in the adjacent column.
				<AttachImagesButton onSelect={ handleAttach } />
			) }
			{ mediaPendingDetach && (
				// A plain `Modal` (not `ConfirmDialog`) so we can pass
				// `overlayClassName` and stack it above the options dropdown that
				// opened it (see the z-index entry in `_z-index.scss`).
				<Modal
					title={ __( 'Detach image' ) }
					onRequestClose={ () => setMediaPendingDetach( undefined ) }
					overlayClassName={ `${ baseCssClass }-detach-modal` }
				>
					<p>
						{ category.postTypeLabel
							? sprintf(
									/* translators: %s: Name of the post type e.g: "Page". */
									__(
										'Detach this image from the current %s? The image will remain in the Media Library.'
									),
									category.postTypeLabel
							  )
							: __(
									'Detach this image from the current post? The image will remain in the Media Library.'
							  ) }
					</p>
					<div className={ `${ baseCssClass }-detach-actions` }>
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => setMediaPendingDetach( undefined ) }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ confirmDetach }
						>
							{ __( 'Detach' ) }
						</Button>
					</div>
				</Modal>
			) }
		</div>
	);
}
