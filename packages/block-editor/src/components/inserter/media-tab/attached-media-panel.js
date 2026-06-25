/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Button, Modal, Spinner } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import MediaList from './media-list';
import MediaUploadCheck from '../../media-upload/check';
import MediaUpload from '../../media-upload';

const ATTACHED_MEDIA_ITEMS_PER_PAGE = 20;

function useAttachedMedia( category, query ) {
	const [ mediaList, setMediaList ] = useState( [] );
	const [ totalItems, setTotalItems ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ hasError, setHasError ] = useState( false );
	const [ refreshCount, setRefreshCount ] = useState( 0 );
	const refresh = useCallback( () => {
		// Enter the loading state synchronously so it stays continuous with the
		// caller's other updates (e.g. clearing per-item busy state). Otherwise
		// there's a one-render gap before the effect below sets it, which
		// unmounts and remounts the loading spinner.
		setIsLoading( true );
		setRefreshCount( ( count ) => count + 1 );
	}, [] );

	useEffect( () => {
		let isMounted = true;

		( async () => {
			setIsLoading( true );
			setHasError( false );

			try {
				const items = await category.fetch( query );

				if ( ! isMounted ) {
					return;
				}

				setMediaList( items );
				setTotalItems(
					category.getTotalItems?.( query ) ?? items.length
				);
			} catch {
				if ( ! isMounted ) {
					return;
				}

				setMediaList( [] );
				setTotalItems( null );
				setHasError( true );
			} finally {
				if ( isMounted ) {
					setIsLoading( false );
				}
			}
		} )();

		return () => {
			isMounted = false;
		};
	}, [ category, query, refreshCount ] );

	return {
		mediaList,
		totalItems,
		isLoading,
		hasError,
		refresh,
	};
}

function MediaLibraryButton( {
	allowedTypes,
	children,
	className,
	disabled,
	icon,
	label,
	onSelect,
	title,
	value,
	variant = 'secondary',
} ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				multiple="add"
				onSelect={ onSelect }
				allowedTypes={ allowedTypes }
				title={ title }
				value={ value }
				render={ ( { open } ) => (
					<Button
						__next40pxDefaultSize
						accessibleWhenDisabled
						className={ className }
						data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
						disabled={ disabled }
						icon={ icon }
						label={ label }
						onClick={ ( event ) => {
							event.target.focus();
							open();
						} }
						variant={ variant }
					>
						{ children }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}

/**
 * Generic host panel for a "current post media" category — one that opts in via
 * `isCurrentPostMedia` and supplies its own behaviour (`attach`, `detach`,
 * `invalidate`, `getTotalItems`) alongside the usual `fetch`. See
 * `getAttachedImagesCategory` in the `editor` package for the WordPress
 * attachments implementation.
 *
 * The category owns all of the source-specific concerns — what the collection
 * is called (`labels.name`), its media type (`mediaType`), and how items are
 * attached/detached — so this component stays media-source-agnostic, mirroring
 * the way `getReportUrl` drives the Openverse "Report" affordance without
 * `block-editor` knowing anything about Openverse.
 *
 * @param {Object}   props
 * @param {Function} props.onInsert Called with a block to insert when an item is clicked.
 * @param {Object}   props.category The current-post media category to render.
 */
export default function AttachedMediaPanel( { onInsert, category } ) {
	const query = useMemo(
		() => ( { per_page: ATTACHED_MEDIA_ITEMS_PER_PAGE } ),
		[]
	);
	const categoryLabel = category.labels?.name;
	// The upload frame's `allowedTypes` is conventionally an array. Default to the
	// category's single `mediaType`, but let a category opt into a broader set by
	// supplying its own `allowedTypes` array.
	const allowedTypes = useMemo(
		() => category.allowedTypes ?? [ category.mediaType ],
		[ category.allowedTypes, category.mediaType ]
	);
	const { mediaList, totalItems, isLoading, hasError, refresh } =
		useAttachedMedia( category, query );
	const [ isAttaching, setIsAttaching ] = useState( false );
	const [ updatingMediaIds, setUpdatingMediaIds ] = useState( [] );
	const [ mediaPendingDetach, setMediaPendingDetach ] = useState();
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const remainingMediaCount = Math.max(
		0,
		( totalItems ?? mediaList.length ) - mediaList.length
	);
	// A single busy flag covering the whole attach/detach/refetch lifecycle, so
	// the grid shows one consistent loading state rather than a per-item spinner
	// followed by a separate area-wide one.
	const isBusy = isLoading || isAttaching || updatingMediaIds.length > 0;

	const refreshAttachedMedia = useCallback( () => {
		category.invalidate?.( query );
		refresh();
	}, [ category, query, refresh ] );

	const handleAttach = useCallback(
		async ( selectedMedia ) => {
			setIsAttaching( true );

			try {
				const attachedCount = await category.attach( selectedMedia );
				refreshAttachedMedia();

				if ( attachedCount ) {
					createSuccessNotice(
						sprintf(
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
				}
			} catch {
				createErrorNotice( __( 'Could not attach images.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			} finally {
				setIsAttaching( false );
			}
		},
		[
			category,
			createErrorNotice,
			createSuccessNotice,
			refreshAttachedMedia,
		]
	);

	const handleDetach = useCallback(
		async ( media ) => {
			setUpdatingMediaIds( ( ids ) => [ ...ids, media.id ] );

			try {
				await category.detach( media );
				refreshAttachedMedia();
				createSuccessNotice( __( 'Image detached from post.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			} catch {
				createErrorNotice( __( 'Could not detach image.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			} finally {
				setUpdatingMediaIds( ( ids ) =>
					ids.filter( ( id ) => id !== media.id )
				);
			}
		},
		[
			category,
			createErrorNotice,
			createSuccessNotice,
			refreshAttachedMedia,
		]
	);

	const confirmDetach = useCallback( () => {
		const media = mediaPendingDetach;
		setMediaPendingDetach( undefined );
		handleDetach( media );
	}, [ handleDetach, mediaPendingDetach ] );

	const mediaIds = useMemo(
		() => mediaList.map( ( media ) => media.id ).filter( Boolean ),
		[ mediaList ]
	);

	return (
		<div className="block-editor-inserter__attached-media-panel">
			<h3 className="block-editor-inserter__attached-media-panel-heading">
				{ categoryLabel }
			</h3>
			{ isLoading && ! mediaList.length && (
				<div className="block-editor-inserter__attached-media-panel-spinner">
					<Spinner />
				</div>
			) }
			{ ! isLoading && hasError && (
				<p className="block-editor-inserter__attached-media-panel-message">
					{ __( 'Could not load attached images.' ) }
				</p>
			) }
			{ ! isLoading && ! hasError && ! mediaList.length && (
				<p className="block-editor-inserter__attached-media-panel-message">
					{ __( 'No images attached to this post.' ) }
				</p>
			) }
			{ !! mediaList.length && (
				<div className="block-editor-inserter__attached-media-panel-results">
					{ /* Keep the existing items visible (dimmed) while busy attaching,
					     detaching or refetching, so the area doesn't flicker. */ }
					<div
						className={ clsx(
							'block-editor-inserter__attached-media-panel-grid',
							{ 'is-loading': isBusy }
						) }
					>
						<MediaList
							category={ category }
							label={ categoryLabel }
							mediaList={ mediaList }
							onClick={ onInsert }
							onDetach={ setMediaPendingDetach }
							variant="compact"
						/>
						{ remainingMediaCount > 0 && (
							<MediaLibraryButton
								allowedTypes={ allowedTypes }
								className="block-editor-inserter__attached-media-panel-more"
								label={ sprintf(
									/* translators: %d: Number of additional attached images. */
									__( 'View %d more attached images' ),
									remainingMediaCount
								) }
								onSelect={ handleAttach }
								title={ categoryLabel }
								value={ mediaIds }
								variant="tertiary"
							>
								{ sprintf(
									/* translators: %d: Number of additional attached images. */
									__( '+%d' ),
									remainingMediaCount
								) }
							</MediaLibraryButton>
						) }
					</div>
					{ isBusy && (
						<div className="block-editor-inserter__attached-media-panel-overlay">
							<Spinner />
						</div>
					) }
				</div>
			) }
			<div className="block-editor-inserter__attached-media-panel-actions">
				<MediaLibraryButton
					allowedTypes={ allowedTypes }
					disabled={ isAttaching }
					icon={ plus }
					onSelect={ handleAttach }
				>
					{ __( 'Attach images' ) }
				</MediaLibraryButton>
			</div>
			{ mediaPendingDetach && (
				<Modal
					title={ __( 'Detach image' ) }
					onRequestClose={ () => setMediaPendingDetach( undefined ) }
					className="block-editor-inserter__attached-media-panel-detach-modal"
				>
					<p>
						{ __(
							'Detach this image from the current post? The image will remain in the Media Library.'
						) }
					</p>
					<div className="block-editor-inserter__attached-media-panel-detach-actions">
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
