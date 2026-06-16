/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	Panel,
	PanelBody,
	Spinner,
} from '@wordpress/components';
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
const ALLOWED_MEDIA_TYPES = [ 'image' ];

function useAttachedMedia( category, query ) {
	const [ mediaList, setMediaList ] = useState( [] );
	const [ totalItems, setTotalItems ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ hasError, setHasError ] = useState( false );
	const [ refreshCount, setRefreshCount ] = useState( 0 );
	const refresh = useCallback(
		() => setRefreshCount( ( count ) => count + 1 ),
		[]
	);

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
				allowedTypes={ ALLOWED_MEDIA_TYPES }
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

export default function AttachedMediaPanel( { onInsert, category } ) {
	const query = useMemo(
		() => ( { per_page: ATTACHED_MEDIA_ITEMS_PER_PAGE } ),
		[]
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
		<Panel className="block-editor-inserter__attached-media-panel">
			<PanelBody title={ category.labels.name } initialOpen>
				{ isLoading && (
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
				{ ! isLoading && ! hasError && !! mediaList.length && (
					<>
						<div className="block-editor-inserter__attached-media-panel-grid">
							<MediaList
								category={ category }
								isItemBusy={ ( media ) =>
									updatingMediaIds.includes( media.id )
								}
								label={ __( 'Attached images' ) }
								mediaList={ mediaList }
								onClick={ onInsert }
								onDetach={ setMediaPendingDetach }
								variant="compact"
							/>
							{ remainingMediaCount > 0 && (
								<MediaLibraryButton
									className="block-editor-inserter__attached-media-panel-more"
									label={ sprintf(
										/* translators: %d: Number of additional attached images. */
										__( 'View %d more attached images' ),
										remainingMediaCount
									) }
									onSelect={ handleAttach }
									title={ __( 'Attached images' ) }
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
					</>
				) }
				<div className="block-editor-inserter__attached-media-panel-actions">
					<MediaLibraryButton
						disabled={ isAttaching }
						icon={ plus }
						onSelect={ handleAttach }
						title={ __( 'Attach images' ) }
					>
						{ __( 'Add' ) }
					</MediaLibraryButton>
				</div>
			</PanelBody>
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
		</Panel>
	);
}
