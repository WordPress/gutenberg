/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	MediaPlaceholder,
	MediaReplaceFlow,
	BlockIcon,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
	InspectorControls,
	InnerBlocks,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	Disabled,
	SelectControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __, _x, sprintf } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { safeHTML, __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];
const DEFAULT_BLOCK = { name: 'core/playlist-track' };
const EMPTY_ARRAY = [];

const PlaylistEdit = ( {
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
	clientId,
} ) => {
	const {
		tracks,
		order,
		showTracklist,
		showNumbers,
		showImages,
		showArtists,
		tagName: TagName = showNumbers ? 'ol' : 'ul',
	} = attributes;
	const [ trackListIndex, setTrackListIndex ] = useState( 0 );
	const blockProps = useBlockProps();
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	const { innerBlockTracks } = useSelect(
		( select ) => {
			const { getBlock: _getBlock } = select( blockEditorStore );
			return {
				innerBlockTracks:
					_getBlock( clientId )?.innerBlocks ?? EMPTY_ARRAY,
			};
		},
		[ clientId ]
	);

	// Monitor changes to the inner blocks.
	useEffect( () => {
		// Update the `tracks` block attribute when an inner block is removed.
		if (
			Array.isArray( tracks ) &&
			tracks.length > innerBlockTracks.length
		) {
			const newTracks = tracks.filter( ( track ) =>
				innerBlockTracks.some(
					( innerTrack ) => innerTrack.attributes.id === track.id
				)
			);
			setAttributes( { tracks: newTracks } );
		}

		// If the tracks have been repositioned, update the `tracks` block attribute.
		if (
			innerBlockTracks.some(
				( innerTrack, index ) =>
					innerTrack.attributes.id !== tracks[ index ].id
			)
		) {
			const sortedTracks = innerBlockTracks.map(
				( track ) => track.attributes
			);
			setAttributes( { tracks: sortedTracks } );
		}
	}, [
		clientId,
		createErrorNotice,
		innerBlockTracks,
		replaceInnerBlocks,
		setAttributes,
		tracks,
	] );

	const onSelectTracks = useCallback(
		( media ) => {
			if ( ! media ) {
				return;
			}

			if ( ! Array.isArray( media ) ) {
				const currentIds = [ ...tracks ];
				media = [ ...currentIds, media ];
			}

			const trackAttributes = ( track ) => ( {
				id: track.id || track.url,
				url: track.url,
				title: track.title,
				artist:
					track.artist ||
					track?.meta?.artist ||
					__( 'Unknown artist' ),
				album:
					track.album || track?.meta?.album || __( 'Unknown album' ),
				length: track.fileLength,
				// Prevent using the default media attachment icon as the track image.
				// Note: Image is not available when a new track is uploaded.
				image:
					track?.image?.src &&
					track?.image?.src.endsWith( '/images/media/audio.svg' )
						? ''
						: track?.image?.src,
			} );

			const trackList = media.map( trackAttributes );
			setAttributes( { tracks: trackList } );

			const newBlocks = trackList.map( ( track ) =>
				createBlock( 'core/playlist-track', track )
			);
			// Replace the inner blocks with the new tracks.
			replaceInnerBlocks(
				clientId,
				innerBlockTracks.concat( newBlocks )
			);
		},
		[
			tracks,
			setAttributes,
			replaceInnerBlocks,
			clientId,
			innerBlockTracks,
		]
	);

	const onTrackEnd = useCallback( () => {
		/* If there are tracks left, play the next track */
		if ( trackListIndex < tracks.length - 1 ) {
			setTrackListIndex( trackListIndex + 1 );
		} else {
			setTrackListIndex( 0 );
		}
	}, [ trackListIndex, tracks ] );

	const onChangeOrder = useCallback(
		( trackOrder ) => {
			const sortedBlocks = [ ...innerBlockTracks ].sort( ( a, b ) => {
				if ( trackOrder === 'ASC' ) {
					return a.attributes.id - b.attributes.id;
				}
				return b.attributes.id - a.attributes.id;
			} );
			replaceInnerBlocks( clientId, sortedBlocks );
			setAttributes( {
				order: trackOrder,
				tracks: sortedBlocks.map( ( block ) => block.attributes ),
			} );
		},
		[ clientId, innerBlockTracks, replaceInnerBlocks, setAttributes ]
	);

	function toggleAttribute( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		allowedBlocks: DEFAULT_BLOCK,
		directInsert: true,
	} );

	if ( ! tracks || ( Array.isArray( tracks ) && tracks.length === 0 ) ) {
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
						onChange={ toggleAttribute( 'showTracklist' ) }
						checked={ showTracklist }
					/>
					{ showTracklist && (
						<>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Show artist name in Tracklist' ) }
								onChange={ toggleAttribute( 'showArtists' ) }
								checked={ showArtists }
							/>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Show number in Tracklist' ) }
								onChange={ toggleAttribute( 'showNumbers' ) }
								checked={ showNumbers }
							/>
						</>
					) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show images' ) }
						onChange={ toggleAttribute( 'showImages' ) }
						checked={ showImages }
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
					{ !! tracks[ trackListIndex ]?.id && (
						<>
							<div className="wp-block-playlist__current-item">
								{ showImages &&
									tracks[ trackListIndex ]?.image && (
										<img
											src={
												tracks[ trackListIndex ].image
											}
											alt=""
											width="70px"
											height="70px"
										/>
									) }
								<div>
									{ tracks[ trackListIndex ]?.title && (
										<span
											className="wp-block-playlist__item-title"
											dangerouslySetInnerHTML={ {
												__html: safeHTML(
													tracks[ trackListIndex ]
														?.title
												),
											} }
										/>
									) }
									<div className="wp-block-playlist__current-item-artist-album">
										{ tracks[ trackListIndex ]?.artist && (
											<span
												className="wp-block-playlist__item-artist"
												dangerouslySetInnerHTML={ {
													__html: safeHTML(
														tracks[ trackListIndex ]
															?.artist
													),
												} }
											/>
										) }
										{ tracks[ trackListIndex ]?.album && (
											<span
												className="wp-block-playlist__item-album"
												dangerouslySetInnerHTML={ {
													__html: safeHTML(
														tracks[ trackListIndex ]
															?.album
													),
												} }
											/>
										) }
									</div>
								</div>
							</div>
							<audio
								controls="controls"
								src={ tracks[ trackListIndex ].url }
								onEnded={ onTrackEnd }
								aria-label={ stripHTML(
									!! tracks[ trackListIndex ]?.title &&
										!! tracks[ trackListIndex ]?.artist &&
										!! tracks[ trackListIndex ]?.album
										? sprintf(
												/* translators: %1$s: track title, %2$s artist name, %3$s: album name. */
												_x(
													'%1$s by %2$s from the album %3$s',
													'track title, artist name, album name'
												),
												tracks[ trackListIndex ]?.title,
												tracks[ trackListIndex ]
													?.artist,
												tracks[ trackListIndex ]?.album
										  )
										: tracks[ trackListIndex ]?.title
								) }
								tabIndex={ 0 }
							/>
						</>
					) }
				</Disabled>
				{ showTracklist && (
					<>
						<TagName className="wp-block-playlist__tracklist">
							{ innerBlocksProps.children }
						</TagName>
						<InnerBlocks.ButtonBlockAppender />
					</>
				) }
				<Caption
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					insertBlocksAfter={ insertBlocksAfter }
					label={ __( 'Playlist caption text' ) }
					showToolbarButton={ isSelected }
					style={ { marginTop: 16 } }
				/>
			</figure>
		</>
	);
};

export default PlaylistEdit;
