/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Button, Modal, Spinner, SearchControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useDebouncedInput } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaList from './media-list';
import MediaUpload from '../../media-upload';
import MediaUploadCheck from '../../media-upload/check';
import { useMediaResults, useDelayedLoading } from './hooks';
import InserterNoResults from '../no-results';

const INITIAL_MEDIA_ITEMS_PER_PAGE = 10;
const ALLOWED_MEDIA_TYPES = [ 'image' ];

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
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				title={ __( 'Attach images' ) }
				render={ ( { open } ) => (
					<Button
						__next40pxDefaultSize
						className="block-editor-inserter__media-panel-attach"
						data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
						icon={ plus }
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
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	// Tracks an in-flight attach/detach (and the refetch that follows it) so the
	// grid can stay visible and dimmed throughout, rather than blanking. Kept
	// separate from the hook's `isLoading` so initial loads and searches still
	// show the centered spinner as before.
	const [ isUpdating, setIsUpdating ] = useState( false );
	const wasLoadingRef = useRef( isLoading );
	useEffect( () => {
		// Clear the updating flag once the refetch we triggered has settled, so
		// `isBusy` stays continuous from the click through to fresh results
		// (no one-frame gap that would restart the spinner).
		if ( wasLoadingRef.current && ! isLoading ) {
			setIsUpdating( false );
		}
		wasLoadingRef.current = isLoading;
	}, [ isLoading ] );
	const isBusy = isLoading || isUpdating;
	// Only dim the populated grid once a refetch has run long enough to be worth
	// signalling; quick attach/detach saves resolve before this and show nothing.
	const showRefreshing = useDelayedLoading( isBusy );

	// Invalidate the cached results and force `useMediaResults` to refetch so
	// the grid reflects images that were just attached or detached.
	const refresh = useCallback( () => {
		category.invalidate?.( query );
		setRefreshKey( ( key ) => key + 1 );
	}, [ category, query ] );

	const handleAttach = useCallback(
		async ( selectedMedia ) => {
			setIsUpdating( true );
			try {
				const attachedCount = await category.attach( selectedMedia );
				refresh();

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
				// The triggered refetch never runs, so clear the busy flag here.
				setIsUpdating( false );
				createErrorNotice( __( 'Could not attach images.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			}
		},
		[ category, refresh, createErrorNotice, createSuccessNotice ]
	);

	const handleDetach = useCallback(
		async ( media ) => {
			setIsUpdating( true );
			try {
				await category.detach( media );
				refresh();
				createSuccessNotice( __( 'Image detached from post.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			} catch {
				// The triggered refetch never runs, so clear the busy flag here.
				setIsUpdating( false );
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
		<div className={ baseCssClass }>
			<SearchControl
				className={ `${ baseCssClass }-search` }
				onChange={ setSearch }
				value={ search }
				label={ searchLabel }
				placeholder={ searchLabel }
			/>
			{ category.description && (
				<p className={ `${ baseCssClass }-description` }>
					{ category.description }
				</p>
			) }
			{ category.attach && (
				<AttachImagesButton onSelect={ handleAttach } />
			) }
			{ isBusy && ! mediaList?.length && (
				<div className={ `${ baseCssClass }-spinner` }>
					<Spinner />
				</div>
			) }
			{ ! isBusy && ! mediaList?.length && <InserterNoResults /> }
			{ !! mediaList?.length && (
				// Keep the existing items visible while attaching/detaching
				// refetches, dimming (and gently pulsing) them rather than
				// clearing the grid, so it doesn't flicker or pop.
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
			{ mediaPendingDetach && (
				<Modal
					title={ __( 'Detach image' ) }
					onRequestClose={ () => setMediaPendingDetach( undefined ) }
					overlayClassName={ `${ baseCssClass }-detach-modal` }
				>
					<p>
						{ __(
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
