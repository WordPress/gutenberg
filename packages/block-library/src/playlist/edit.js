/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import {
	store as blockEditorStore,
	MediaPlaceholder,
	MediaReplaceFlow,
	BlockIcon,
	useBlockProps,
	useInnerBlocksProps,
	BlockControls,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';
import { PlaylistContext } from './context';
import { getTrackAttributes } from './utils';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];
const ALLOWED_BLOCKS = [ 'core/playlist-player', 'core/playlist-tracklist' ];

function getStyleVariationName( className ) {
	return className?.match( /is-style-([\w-]+)/ )?.[ 1 ];
}

const PlaylistEdit = ( {
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
	clientId,
} ) => {
	const blockProps = useBlockProps();
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}
	const [ currentTrackClientId, setCurrentTrackClientId ] = useState( null );

	const { innerBlocks } = useSelect(
		( select ) => {
			const { getBlock: _getBlock } = select( blockEditorStore );
			return {
				innerBlocks: _getBlock( clientId )?.innerBlocks ?? [],
			};
		},
		[ clientId ]
	);

	const playerBlock = innerBlocks.find(
		( block ) => block.name === 'core/playlist-player'
	);
	const tracklistBlock = innerBlocks.find(
		( block ) => block.name === 'core/playlist-tracklist'
	);
	const directTrackBlocks = innerBlocks.filter(
		( block ) => block.name === 'core/playlist-track'
	);
	const innerBlockTracks = tracklistBlock?.innerBlocks ?? directTrackBlocks;

	// Create a list of tracks from the inner blocks,
	// but skip blocks that do not have a source, such as the media placeholder.
	const validTracks = useMemo(
		() =>
			innerBlockTracks.filter(
				( block ) => !! block.attributes.src || !! block.attributes.blob
			),
		[ innerBlockTracks ]
	);
	const tracks = useMemo(
		() =>
			validTracks.map( ( block ) => ( {
				...block.attributes,
				clientId: block.clientId,
			} ) ),
		[ validTracks ]
	);

	useEffect( () => {
		if ( innerBlocks.length === 0 ) {
			return;
		}

		if ( playerBlock && tracklistBlock && directTrackBlocks.length === 0 ) {
			return;
		}

		const trackBlocks = [
			...( tracklistBlock?.innerBlocks ?? [] ),
			...directTrackBlocks,
		];

		if ( trackBlocks.length === 0 ) {
			return;
		}

		const playerAttributes =
			playerBlock?.attributes ??
			( attributes.className ? { className: attributes.className } : {} );
		const tracklistAttributes = tracklistBlock?.attributes ?? {
			order: attributes.order ?? 'asc',
			showImages: attributes.showImages ?? true,
			showArtists: attributes.showArtists ?? true,
			showNumbers: attributes.showNumbers ?? true,
			showTrackLength: attributes.showTrackLength ?? true,
		};
		const normalizedTracklistBlock = tracklistBlock
			? {
					...tracklistBlock,
					innerBlocks: trackBlocks,
			  }
			: createBlock(
					'core/playlist-tracklist',
					tracklistAttributes,
					trackBlocks
			  );
		const normalizedBlocks = [
			playerBlock ??
				createBlock( 'core/playlist-player', playerAttributes ),
			normalizedTracklistBlock,
		];
		const normalizedCurrentTrack =
			trackBlocks.find(
				( block ) => block.clientId === currentTrackClientId
			) ?? trackBlocks[ 0 ];

		replaceInnerBlocks( clientId, normalizedBlocks, false );
		setCurrentTrackClientId( normalizedCurrentTrack?.clientId ?? null );
	}, [
		attributes.className,
		attributes.order,
		attributes.showArtists,
		attributes.showImages,
		attributes.showNumbers,
		attributes.showTrackLength,
		clientId,
		currentTrackClientId,
		directTrackBlocks,
		innerBlocks.length,
		playerBlock,
		replaceInnerBlocks,
		setCurrentTrackClientId,
		tracklistBlock,
	] );

	useEffect( () => {
		if ( validTracks.length === 0 ) {
			if ( currentTrackClientId !== null ) {
				setCurrentTrackClientId( null );
			}
			return;
		}

		const currentTrackExists = validTracks.some(
			( block ) => block.clientId === currentTrackClientId
		);
		if ( ! currentTrackExists ) {
			setCurrentTrackClientId( validTracks[ 0 ].clientId );
		}
	}, [ currentTrackClientId, setCurrentTrackClientId, validTracks ] );

	const onSelectTracks = useCallback(
		( media ) => {
			if ( ! media ) {
				return;
			}

			if ( ! Array.isArray( media ) ) {
				media = [ media ];
			}

			const trackList = media.map( getTrackAttributes );

			const trackBlocks = trackList.map( ( track ) =>
				createBlock( 'core/playlist-track', track )
			);
			const newBlocks = [
				createBlock(
					'core/playlist-player',
					playerBlock?.attributes ?? {}
				),
				createBlock(
					'core/playlist-tracklist',
					tracklistBlock?.attributes ?? {},
					trackBlocks
				),
			];

			setCurrentTrackClientId( trackBlocks[ 0 ]?.clientId ?? null );
			// Replace the inner blocks with the new playlist structure.
			replaceInnerBlocks( clientId, newBlocks );
		},
		[
			replaceInnerBlocks,
			clientId,
			playerBlock?.attributes,
			setCurrentTrackClientId,
			tracklistBlock?.attributes,
		]
	);

	// Get current track data by finding the track with matching client ID.
	const currentTrackData =
		tracks.find( ( track ) => track.clientId === currentTrackClientId ) ??
		tracks[ 0 ];

	// Handle track end - advance to next track or loop to first.
	const onTrackEnded = useCallback( () => {
		const currentIndex = tracks.findIndex(
			( track ) => track.clientId === currentTrackClientId
		);
		const nextTrack = tracks[ currentIndex + 1 ] || tracks[ 0 ];
		if ( nextTrack?.clientId ) {
			setCurrentTrackClientId( nextTrack.clientId );
		}
	}, [ currentTrackClientId, setCurrentTrackClientId, tracks ] );

	const playlistContext = useMemo(
		() => ( {
			currentTrackClientId,
			currentTrackData,
			onTrackEnded,
			setCurrentTrackClientId,
			showImages:
				tracklistBlock?.attributes?.showImages ??
				attributes.showImages ??
				true,
			waveformStyle:
				getStyleVariationName( playerBlock?.attributes?.className ) ??
				getStyleVariationName( attributes.className ) ??
				'bars',
		} ),
		[
			attributes.className,
			attributes.showImages,
			currentTrackClientId,
			currentTrackData,
			onTrackEnded,
			playerBlock?.attributes?.className,
			setCurrentTrackClientId,
			tracklistBlock?.attributes?.showImages,
		]
	);

	const { children, ...innerBlocksProps } = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		renderAppender: false,
		templateLock: 'all',
	} );

	if ( tracks.length === 0 ) {
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
			<figure { ...innerBlocksProps }>
				<PlaylistContext.Provider value={ playlistContext }>
					{ children }
				</PlaylistContext.Provider>
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
