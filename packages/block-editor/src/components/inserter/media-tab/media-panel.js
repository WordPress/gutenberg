/**
 * WordPress dependencies
 */
import { Button, Spinner, SearchControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';
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
import { useMediaResults } from './hooks';
import InserterNoResults from '../no-results';

const INITIAL_MEDIA_ITEMS_PER_PAGE = 10;
const ALLOWED_MEDIA_TYPES = [ 'image' ];

/**
 * Opens the Media Library to attach images to the current post. Only rendered
 * for media categories that expose an `attach` capability (i.e. the "Attached
 * images" source); other sources render the panel exactly as before.
 *
 * @param {Object}   props
 * @param {number[]} props.mediaIds The ids of the currently shown images, used
 *                                  to preselect them in the Media Library.
 * @param {Function} props.onSelect Called with the selected media items.
 */
function AttachImagesButton( { mediaIds, onSelect } ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				multiple="add"
				onSelect={ onSelect }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				title={ __( 'Attach images' ) }
				value={ mediaIds }
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
			try {
				await category.detach( media );
				refresh();
				createSuccessNotice( __( 'Image detached from post.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			} catch {
				createErrorNotice( __( 'Could not detach image.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			}
		},
		[ category, refresh, createErrorNotice, createSuccessNotice ]
	);

	const mediaIds = useMemo(
		() =>
			( mediaList || [] ).map( ( media ) => media.id ).filter( Boolean ),
		[ mediaList ]
	);

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
				<AttachImagesButton
					mediaIds={ mediaIds }
					onSelect={ handleAttach }
				/>
			) }
			{ isLoading && (
				<div className={ `${ baseCssClass }-spinner` }>
					<Spinner />
				</div>
			) }
			{ ! isLoading && ! mediaList?.length && <InserterNoResults /> }
			{ ! isLoading && !! mediaList?.length && (
				<MediaList
					rootClientId={ rootClientId }
					onClick={ onInsert }
					onDetach={ category.detach ? handleDetach : undefined }
					mediaList={ mediaList }
					category={ category }
				/>
			) }
		</div>
	);
}
