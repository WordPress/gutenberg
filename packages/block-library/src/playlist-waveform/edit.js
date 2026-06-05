/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import {
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { Disabled } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { WaveformPlayer } from '../utils/waveform-player';

const getPlaylistTracks = ( innerBlocks ) => {
	const tracklist = innerBlocks.find(
		( block ) => block.name === 'core/playlist-tracklist'
	);
	return (
		tracklist?.innerBlocks ??
		innerBlocks.filter( ( block ) => block.name === 'core/playlist-track' )
	);
};

const PlaylistWaveformEdit = ( {
	attributes,
	clientId,
	context,
	isSelected,
} ) => {
	const waveformStyle =
		attributes.className?.match( /is-style-([\w-]+)/ )?.[ 1 ] || 'bars';
	const blockProps = useBlockProps();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { isParentSelected, parentPlaylistId, tracks } = useSelect(
		( select ) => {
			const { getBlock, getBlockParentsByBlockName, isBlockSelected } =
				select( blockEditorStore );
			const [ playlistId ] = getBlockParentsByBlockName(
				clientId,
				'core/playlist'
			);
			const playlist = playlistId ? getBlock( playlistId ) : undefined;

			return {
				isParentSelected: playlistId
					? isBlockSelected( playlistId )
					: false,
				parentPlaylistId: playlistId,
				tracks: playlist
					? getPlaylistTracks( playlist.innerBlocks )
							.filter( ( block ) => !! block.attributes.uniqueId )
							.map( ( block ) => block.attributes )
					: [],
			};
		},
		[ clientId ]
	);

	const currentTrack = context?.currentTrack;
	const currentTrackData = tracks.find(
		( track ) => track.uniqueId === currentTrack
	);

	const onTrackEnded = useCallback( () => {
		const currentIndex = tracks.findIndex(
			( track ) => track.uniqueId === currentTrack
		);
		const nextTrack = tracks[ currentIndex + 1 ] || tracks[ 0 ];
		if ( nextTrack?.uniqueId && parentPlaylistId ) {
			updateBlockAttributes( parentPlaylistId, {
				currentTrack: nextTrack.uniqueId,
			} );
		}
	}, [ currentTrack, parentPlaylistId, tracks, updateBlockAttributes ] );

	return (
		<div { ...blockProps }>
			<Disabled isDisabled={ ! ( isSelected || isParentSelected ) }>
				<WaveformPlayer
					src={ currentTrackData?.src }
					title={ currentTrackData?.title }
					artist={ currentTrackData?.artist }
					image={ currentTrackData?.image }
					waveformStyle={ waveformStyle }
					onEnded={ onTrackEnded }
				/>
			</Disabled>
		</div>
	);
};

export default PlaylistWaveformEdit;
