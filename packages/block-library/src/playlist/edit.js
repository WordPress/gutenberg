/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import {
	MediaPlaceholder,
	MediaReplaceFlow,
	BlockIcon,
	useBlockProps,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	Disabled,
	SelectControl,
	Button,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __, _x, sprintf } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { safeHTML, __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

const PlaylistEdit = ( {
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
} ) => {
	const {
		ids,
		order,
		tracklist,
		tracknumbers,
		images,
		artists,
		tagName: TagName = tracknumbers ? 'ol' : 'ul',
	} = attributes;
	const [ trackListIndex, setTrackListIndex ] = useState( 0 );
	const blockProps = useBlockProps();

	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	const onSelectTracks = useCallback(
		( media ) => {
			if ( ! media ) {
				return;
			}

			if ( ! Array.isArray( media ) ) {
				const currentIds = [ ...ids ];
				media = [ ...currentIds, media ];
			}

			const trackList = media.map( ( track ) => ( {
				id: track.id ? track.id : track.url,
				url: track.url,
				title: track.title,
				artist: track.artist,
				album: track.album,
				caption: track.caption,
				length: track.fileLength,
				image: track.image ? track.image : '',
			} ) );
			setAttributes( { ids: trackList } );
		},
		[ ids, setAttributes ]
	);

	const onChangeTrack = useCallback( ( index ) => {
		setTrackListIndex( index );
	}, [] );

	const onTrackEnd = useCallback( () => {
		/* If there are tracks left, play the next track */
		if ( trackListIndex < ids.length - 1 ) {
			setTrackListIndex( trackListIndex + 1 );
		} else {
			setTrackListIndex( 0 );
		}
	}, [ trackListIndex, ids ] );

	const onChangeOrder = useCallback(
		( trackOrder ) => {
			const sortedIds = [ ...ids ];
			if ( 'ASC' === trackOrder ) {
				sortedIds.sort( ( a, b ) => a.id - b.id );
			} else {
				sortedIds.sort( ( a, b ) => b.id - a.id );
			}

			setAttributes( { order: trackOrder, ids: sortedIds } );
		},
		[ ids, setAttributes ]
	);

	function toggleAttribute( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	if ( ! ids ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					labels={ {
						title: __( 'Playlist' ),
						instructions: __(
							'Upload an audio file or pick one from your media library.'
						),
					} }
					onSelect={ onSelectTracks }
					accept="audio/*"
					multiple
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ attributes }
					onError={ onUploadError }
				/>
			</div>
		);
	}

	return (
		<>
			<BlockControls group="other">
				<MediaReplaceFlow
					name={ __( 'Edit' ) }
					onSelect={ ( value ) => onSelectTracks( value ) }
					accept="audio/*"
					addToPlaylist
					mediaIds={ ids
						.filter( ( track ) => track.id )
						.map( ( track ) => track.id ) }
					multiple
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ attributes }
					onError={ onUploadError }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show Tracklist' ) }
						onChange={ toggleAttribute( 'tracklist' ) }
						checked={ tracklist }
					/>
					{ tracklist && (
						<>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Show artist name in Tracklist' ) }
								onChange={ toggleAttribute( 'artists' ) }
								checked={ artists }
							/>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Show number in Tracklist' ) }
								onChange={ toggleAttribute( 'tracknumbers' ) }
								checked={ tracknumbers }
							/>
						</>
					) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show images' ) }
						onChange={ toggleAttribute( 'images' ) }
						checked={ images }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Order' ) }
						value={ order }
						options={ [
							{ label: __( 'Descending' ), value: 'DESC' },
							{ label: __( 'Ascending' ), value: 'ASC' },
						] }
						onChange={ ( value ) => onChangeOrder( value ) }
					/>
				</PanelBody>
			</InspectorControls>
			<figure { ...blockProps }>
				<Disabled isDisabled={ ! isSelected }>
					{ !! ids[ trackListIndex ]?.id && (
						<>
							<div className="wp-block-playlist__current-item">
								{ images && (
									<img
										src={
											ids[ trackListIndex ]?.image.src
												? ids[ trackListIndex ]?.image
														.src
												: '/wp-includes/images/media/audio.png'
										}
										width="48px"
										height="64px"
										alt=""
									/>
								) }
								<div>
									{ ids[ trackListIndex ]?.album && (
										<span
											className="wp-block-playlist__item-album"
											dangerouslySetInnerHTML={ {
												__html: safeHTML(
													ids[ trackListIndex ]?.album
												),
											} }
										/>
									) }
									{ ids[ trackListIndex ]?.artist && (
										<span
											className="wp-block-playlist__item-artist"
											dangerouslySetInnerHTML={ {
												__html: safeHTML(
													ids[ trackListIndex ]
														?.artist
												),
											} }
										/>
									) }
								</div>
							</div>
							<audio
								controls="controls"
								src={ ids[ trackListIndex ].url }
								onEnded={ onTrackEnd }
								aria-label={ stripHTML(
									!! ids[ trackListIndex ]?.title &&
										!! ids[ trackListIndex ]?.artist &&
										!! ids[ trackListIndex ]?.album
										? sprintf(
												/* translators: %1$s: track title, %2$s artist name, %3$s: album name. */
												_x(
													'%1$s by %2$s from the album %3$s',
													'track title, artist name, album name'
												),
												ids[ trackListIndex ]?.title,
												ids[ trackListIndex ]?.artist,
												ids[ trackListIndex ]?.album
										  )
										: ids[ trackListIndex ]?.title
								) }
								tabIndex={ 0 }
							/>
						</>
					) }
					<TagName
						className="wp-block-playlist__tracks"
						hidden={ ! tracklist ? true : false }
					>
						{ ids.map( ( track, index ) => (
							<li
								key={ track.id }
								className="wp-block-playlist__item"
							>
								<Button
									__next40pxDefaultSize
									aria-current={
										track.id === ids[ trackListIndex ]?.id
									}
									data-playlist-track-url={ track.url }
									data-playlist-track-title={ stripHTML(
										track.title
									) }
									data-playlist-track-artist={ stripHTML(
										track.artist
									) }
									data-playlist-track-album={ stripHTML(
										track.album
									) }
									data-playlist-track-image-src={
										track.image.src
											? track.image.src
											: '/wp-includes/images/media/audio.png'
									}
									onClick={ () => onChangeTrack( index ) }
								>
									{ artists ? (
										<span
											className="wp-block-playlist__item-title"
											/* Use quotation marks for titles when they are
											 * combined with the artist name,
											 * @see https://core.trac.wordpress.org/changeset/55251
											 */
											dangerouslySetInnerHTML={ {
												__html: safeHTML(
													'\u201c' +
														track?.title +
														'\u201d'
												),
											} }
										/>
									) : (
										<span
											className="wp-block-playlist__item-title"
											dangerouslySetInnerHTML={ {
												__html: safeHTML(
													track?.title
												),
											} }
										/>
									) }
									{ artists && track.artist && (
										<span
											className="wp-block-playlist__item-artist"
											dangerouslySetInnerHTML={ {
												__html: safeHTML(
													'\u2014 ' + track.artist
												),
											} }
										/>
									) }
									<span className="wp-block-playlist__item-length">
										{ track?.length && (
											<span className="screen-reader-text">
												{
													/* translators: %s: Visually hidden label for the track length (screen reader text). */
													__( 'Length:' )
												}
											</span>
										) }
										{ track?.length }
									</span>
									<span className="screen-reader-text">
										{ __( 'Select to play this track' ) }
									</span>
								</Button>
							</li>
						) ) }
					</TagName>
				</Disabled>
				<Caption
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					insertBlocksAfter={ insertBlocksAfter }
					label={ __( 'Playlist caption text' ) }
					showToolbarButton={ isSelected }
				/>
			</figure>
		</>
	);
};

export default PlaylistEdit;
