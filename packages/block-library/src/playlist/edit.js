/**
 * External dependencies
 */
import clsx from 'clsx';

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
	Spinner,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
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

const CurrentTrack = ( { trackData, showImages, onTrackEnd } ) => {
	const id = trackData?.id;
	/**
	 * dangerouslySetInnerHTML and safeHTML are used because
	 * the media library allows using some HTML tags in the title, artist, and album fields.
	 */
	const track = useSelect(
		( select ) => {
			const media = id && select( coreStore ).getMedia( id );
			return {
				artist:
					media?.artist ||
					media?.meta?.artist ||
					media?.media_details?.artist ||
					__( 'Unknown artist' ),
				album:
					media?.album ||
					media?.meta?.album ||
					media?.media_details?.album ||
					__( 'Unknown album' ),
				// Prevent using the default media attachment icon as the track image.
				image:
					media?.image?.src &&
					media?.image?.src.endsWith( '/images/media/audio.svg' )
						? ''
						: media?.image?.src,
				fileLength:
					media?.fileLength || media?.media_details?.length_formatted,
				// Important: This is not the media details title, but the title of the attachment.
				title: media?.title.rendered,
				url: media?.url,
			};
		},
		[ id ]
	);

	let ariaLabel;
	if ( track?.title && track?.artist && track?.album ) {
		ariaLabel = stripHTML(
			sprintf(
				/* translators: %1$s: track title, %2$s artist name, %3$s: album name. */
				_x(
					'%1$s by %2$s from the album %3$s',
					'track title, artist name, album name'
				),
				track?.title,
				track?.artist,
				track?.album
			)
		);
	} else if ( track?.title ) {
		ariaLabel = stripHTML( track.title );
	} else {
		ariaLabel = stripHTML( __( 'Untitled' ) );
	}

	return (
		<>
			<div className="wp-block-playlist__current-item">
				{ showImages && track?.image && (
					<img
						className="wp-block-playlist__item-image"
						src={ track.image }
						alt=""
						width="70px"
						height="70px"
					/>
				) }
				<div>
					{ ! track?.title ? (
						<span className="wp-block-playlist__item-title">
							<Spinner />
						</span>
					) : (
						<span
							className="wp-block-playlist__item-title"
							dangerouslySetInnerHTML={ {
								__html: safeHTML( track?.title ),
							} }
						/>
					) }
					<div className="wp-block-playlist__current-item-artist-album">
						<span
							className="wp-block-playlist__item-artist"
							dangerouslySetInnerHTML={ {
								__html: safeHTML( track?.artist ),
							} }
						/>
						<span
							className="wp-block-playlist__item-album"
							dangerouslySetInnerHTML={ {
								__html: safeHTML( track?.album ),
							} }
						/>
					</div>
				</div>
			</div>
			<audio
				controls="controls"
				src={ track?.url ? track.url : '' }
				onEnded={ onTrackEnd }
				aria-label={ ariaLabel }
				tabIndex={ 0 }
			/>
		</>
	);
};

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
		currentTrack,
		tagName: TagName = showNumbers ? 'ol' : 'ul',
	} = attributes;
	const [ trackListIndex, setTrackListIndex ] = useState( 0 );
	const blockProps = useBlockProps();
	const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	const { innerBlockTracks } = useSelect(
		( select ) => {
			const { getBlock: _getBlock } = select( blockEditorStore );
			return {
				innerBlockTracks: _getBlock( clientId )?.innerBlocks ?? [],
			};
		},
		[ clientId ]
	);

	// Monitor changes to the inner blocks.
	useEffect( () => {
		// If the tracks have been repositioned, update the `tracks` block attribute.
		if (
			innerBlockTracks.some(
				( innerTrack, index ) =>
					innerTrack.attributes.id !== tracks[ index ]?.id
			)
		) {
			const sortedTracks = innerBlockTracks.map(
				( track ) => track.attributes
			);
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				tracks: sortedTracks,
			} );
			// Update the current track if the first track has changed, and there is a track id.
			if (
				sortedTracks.length > 0 &&
				sortedTracks[ 0 ].id &&
				sortedTracks[ 0 ].id !== currentTrack
			) {
				__unstableMarkNextChangeAsNotPersistent();
				setAttributes( { currentTrack: sortedTracks[ 0 ].id } );
			}
		}

		const updatedTracks = innerBlockTracks.map(
			( block ) => block.attributes
		);
		const hasChanges = updatedTracks.some(
			( updatedTrack, index ) =>
				! tracks[ index ] ||
				Object.keys( updatedTrack ).some(
					( key ) => updatedTrack[ key ] !== tracks[ index ]?.[ key ]
				)
		);
		if ( hasChanges || updatedTracks.length !== tracks?.length ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				tracks: updatedTracks,
				currentTrack:
					updatedTracks.length > 0 &&
					// If the first track has changed, update the `currentTrack` block attribute.
					updatedTracks[ 0 ].id !== currentTrack
						? updatedTracks[ 0 ].id
						: currentTrack,
			} );
		}
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		clientId,
		createErrorNotice,
		currentTrack,
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
				media = [ media ];
			}

			const trackAttributes = ( track ) => ( {
				id: track.id || track.url,
				src: track.url,
			} );

			const trackList = media.map( trackAttributes );
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				tracks: trackList,
				currentTrack: trackList.length > 0 ? trackList[ 0 ].id : null,
			} );

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
			__unstableMarkNextChangeAsNotPersistent,
			setAttributes,
			replaceInnerBlocks,
			clientId,
			innerBlockTracks,
		]
	);

	const onTrackEnd = useCallback( () => {
		/* If there are tracks left, play the next track */
		if ( trackListIndex < tracks.length - 1 ) {
			if ( tracks[ trackListIndex + 1 ]?.id ) {
				setTrackListIndex( trackListIndex + 1 );
				setAttributes( {
					currentTrack: tracks[ trackListIndex + 1 ].id,
				} );
			}
		} else {
			setTrackListIndex( 0 );
			if ( tracks[ 0 ].id ) {
				setAttributes( { currentTrack: tracks[ 0 ].id } );
			} else if ( tracks.length > 0 ) {
				const validTrack = tracks.find(
					( track ) => track.id !== undefined
				);
				if ( validTrack ) {
					setAttributes( { currentTrack: validTrack.id } );
				}
			}
		}
	}, [ setAttributes, trackListIndex, tracks ] );

	const onChangeOrder = useCallback(
		( trackOrder ) => {
			const sortedBlocks = [ ...innerBlockTracks ].sort( ( a, b ) => {
				if ( trackOrder === 'ASC' ) {
					return a.attributes.id - b.attributes.id;
				}
				return b.attributes.id - a.attributes.id;
			} );
			const sortedTracks = sortedBlocks.map(
				( block ) => block.attributes
			);
			replaceInnerBlocks( clientId, sortedBlocks );
			setAttributes( {
				order: trackOrder,
				tracks: sortedTracks,
				currentTrack:
					sortedTracks.length > 0 &&
					sortedTracks[ 0 ].id !== currentTrack
						? sortedTracks[ 0 ].id
						: currentTrack,
			} );
		},
		[
			clientId,
			currentTrack,
			innerBlockTracks,
			replaceInnerBlocks,
			setAttributes,
		]
	);

	function toggleAttribute( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	const hasSelectedChild = useSelect(
		( select ) =>
			select( blockEditorStore ).hasSelectedInnerBlock( clientId ),
		[ clientId ]
	);

	const hasAnySelected = isSelected || hasSelectedChild;

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		__experimentalAppenderTagName: 'li',
		renderAppender: hasAnySelected && InnerBlocks.ButtonBlockAppender,
	} );

	if ( ! tracks || ( Array.isArray( tracks ) && tracks.length === 0 ) ) {
		return (
			<div
				{ ...blockProps }
				className={ clsx( 'is-placeholder', blockProps.className ) }
			>
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
					onSelect={ onSelectTracks }
					accept="audio/*"
					multiple
					mediaIds={ tracks
						.filter( ( track ) => track.id )
						.map( ( track ) => track.id ) }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
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
					<CurrentTrack
						trackData={ tracks[ trackListIndex ] }
						showImages={ showImages }
						onTrackEnd={ onTrackEnd }
					/>
				</Disabled>
				{ showTracklist && (
					<>
						<TagName className="wp-block-playlist__tracklist">
							{ innerBlocksProps.children }
						</TagName>
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
