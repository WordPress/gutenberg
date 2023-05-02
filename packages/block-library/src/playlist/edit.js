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
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

const PlaylistEdit = ( { attributes, setAttributes, isSelected } ) => {
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
			const trackList = media.map( ( track ) => ( {
				id: track.id,
				url: track.url,
				title: track.title,
				artist: track.artist,
				album: track.album,
				caption: track.caption,
				length: track.fileLength,
				image: track.image,
			} ) );
			setAttributes( { ids: trackList } );
		},
		[ setAttributes ]
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
					} }
					onSelect={ onSelectTracks }
					accept="audio/*"
					addToPlaylist={ true }
					multiple={ true }
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
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					name={ __( 'Edit Tracks' ) }
					accept="audio/*"
					playlist={ true }
					multiple={ true }
					mediaIds={ ids
						.filter( ( track ) => track.id )
						.map( ( track ) => track.id ) }
					addToPlaylist={ true }
					onSelect={ onSelectTracks }
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
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show artists in Tracklist' ) }
						onChange={ toggleAttribute( 'artists' ) }
						checked={ artists }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show number in Tracklist' ) }
						onChange={ toggleAttribute( 'tracknumbers' ) }
						checked={ tracknumbers }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show images' ) }
						onChange={ toggleAttribute( 'images' ) }
						checked={ images }
					/>
					<SelectControl
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
					{ !! ids[ trackListIndex ].id && (
						<div className="wp-block-playlist__current-item">
							{ images && (
								<img
									src={ ids[ trackListIndex ]?.image.src }
									width={ ids[ trackListIndex ]?.image.width }
									height={
										ids[ trackListIndex ]?.image.height
									}
									alt=""
								/>
							) }
							<ul>
								<li className="wp-block-playlist__item-title">
									{ '\u201c' +
										ids[ trackListIndex ]?.title +
										'\u201d' }
								</li>
								<li className="wp-block-playlist__item-album">
									{ ids[ trackListIndex ]?.album }
								</li>
								<li className="wp-block-playlist__item-artist">
									{ ids[ trackListIndex ]?.artist }
								</li>
							</ul>
							<audio
								controls="controls"
								src={ ids[ trackListIndex ].url }
								onEnded={ onTrackEnd }
								autoPlay={ true }
							/>
						</div>
					) }
					{ tracklist && (
						<TagName className="wp-block-playlist__tracks">
							{ ids.map( ( track, index ) => (
								<li
									key={ track.id }
									className="wp-block-playlist__item"
								>
									<Button
										aria-current={
											track.id ===
											ids[ trackListIndex ]?.id
										}
										data-playlist-track-url={ track.url }
										onClick={ () => onChangeTrack( index ) }
									>
										<span className="wp-block-playlist__item-title">
											{ /* Only use quotation marks for titles when they are
											 * combined with the artist name,
											 * @see https://core.trac.wordpress.org/changeset/55251
											 */ }
											{ artists
												? '\u201c' +
												  track?.title +
												  '\u201d'
												: track?.title }
										</span>
										{ artists && track.artist && (
											<span className="wp-block-playlist__item-artist">
												{ '\u2014 ' + track.artist }
											</span>
										) }
										<span className="wp-block-playlist__item-length">
											{ track?.length }
										</span>
									</Button>
								</li>
							) ) }
						</TagName>
					) }
				</Disabled>
			</figure>
		</>
	);
};

export default PlaylistEdit;
