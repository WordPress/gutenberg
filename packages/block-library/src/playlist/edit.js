/**
 * External dependencies
 */
import clsx from 'clsx';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
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
	ToggleControl,
	Disabled,
	SelectControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { WaveformPlayer } from '../utils/waveform-player';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

/**
 * Transform media library data into track block attributes.
 *
 * @param {Object} media - Media object from the media library.
 * @return {Object} Track attributes for the playlist-track block.
 */
function getTrackAttributes( media ) {
	return {
		id: media.id || media.url, // Attachment ID or URL.
		uniqueId: uuid(), // Unique ID for the track.
		src: media.url,
		title: media.title,
		artist:
			media.artist ||
			media?.meta?.artist ||
			media?.media_details?.artist ||
			__( 'Unknown artist' ),
		album:
			media.album ||
			media?.meta?.album ||
			media?.media_details?.album ||
			__( 'Unknown album' ),
		length: media?.fileLength || media?.media_details?.length_formatted,
		// Prevent using the default media attachment icon as the track image.
		// Note: Image is not available when a new track is uploaded.
		image:
			media?.image?.src &&
			media?.image?.src.endsWith( '/images/media/audio.svg' )
				? ''
				: media?.image?.src,
	};
}

const PlaylistEdit = ( {
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
	clientId,
} ) => {
	const {
		order,
		showTracklist,
		showNumbers,
		showImages,
		showArtists,
		currentTrack,
	} = attributes;
	const blockProps = useBlockProps();
	const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const { innerBlockTracks } = useSelect(
		( select ) => {
			const { getBlock: _getBlock } = select( blockEditorStore );
			return {
				innerBlockTracks: _getBlock( clientId )?.innerBlocks ?? [],
			};
		},
		[ clientId ]
	);

	// Ensure that each inner block has a unique ID,
	// even if a track is duplicated.
	useEffect( () => {
		const seen = new Set();
		let hasDuplicates = false;
		const updatedBlocks = innerBlockTracks.map( ( block ) => {
			if ( seen.has( block.attributes.uniqueId ) ) {
				hasDuplicates = true;
				return {
					...block,
					attributes: {
						...block.attributes,
						uniqueId: uuid(),
					},
				};
			}
			seen.add( block.attributes.uniqueId );
			return block;
		} );
		if ( hasDuplicates ) {
			replaceInnerBlocks( clientId, updatedBlocks );
		}
	}, [ innerBlockTracks, clientId, replaceInnerBlocks ] );

	// Create a list of tracks from the inner blocks,
	// but skip blocks that do not have a uniqueId attribute, such as the media placeholder.
	const validTracks = innerBlockTracks.filter(
		( block ) => !! block.attributes.uniqueId
	);
	const tracks = validTracks.map( ( block ) => block.attributes );
	const firstTrackId = validTracks[ 0 ]?.attributes?.uniqueId;

	// updateBlockAttributes is used to force updating the parent playlist block
	// when the currentTrack changes. Using setAttributes directly does not update
	// the currentTrack when multiple tracks are moved at the same time.
	useEffect( () => {
		if ( tracks.length === 0 ) {
			// If there are no tracks but currentTrack is set, set it to null.
			if ( currentTrack !== null ) {
				updateBlockAttributes( clientId, { currentTrack: null } );
			}
		} else if (
			// If the currentTrack is not the first track, update it to the first track.
			firstTrackId &&
			firstTrackId !== currentTrack
		) {
			updateBlockAttributes( clientId, { currentTrack: firstTrackId } );
		}
	}, [
		tracks,
		currentTrack,
		firstTrackId,
		clientId,
		updateBlockAttributes,
	] );

	const onSelectTracks = useCallback(
		( media ) => {
			if ( ! media ) {
				return;
			}

			if ( ! Array.isArray( media ) ) {
				media = [ media ];
			}

			const trackList = media.map( getTrackAttributes );
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( {
				currentTrack:
					trackList.length > 0 ? trackList[ 0 ].uniqueId : null,
			} );

			const newBlocks = trackList.map( ( track ) =>
				createBlock( 'core/playlist-track', track )
			);
			// Replace the inner blocks with the new tracks.
			replaceInnerBlocks( clientId, newBlocks );
		},
		[
			__unstableMarkNextChangeAsNotPersistent,
			setAttributes,
			replaceInnerBlocks,
			clientId,
		]
	);

	// Get current track data by finding the track with matching uniqueId.
	const currentTrackData = tracks.find(
		( track ) => track.uniqueId === currentTrack
	);

	// Handle track end - advance to next track or loop to first.
	const onTrackEnded = useCallback( () => {
		const currentIndex = tracks.findIndex(
			( track ) => track.uniqueId === currentTrack
		);
		const nextTrack = tracks[ currentIndex + 1 ] || tracks[ 0 ];
		if ( nextTrack?.uniqueId ) {
			setAttributes( { currentTrack: nextTrack.uniqueId } );
		}
	}, [ currentTrack, tracks, setAttributes ] );

	const onChangeOrder = useCallback(
		( trackOrder ) => {
			const sortedBlocks = [ ...innerBlockTracks ].sort( ( a, b ) => {
				const titleA = a.attributes.title || '';
				const titleB = b.attributes.title || '';

				if ( trackOrder === 'asc' ) {
					return titleA.localeCompare( titleB );
				}
				return titleB.localeCompare( titleA );
			} );
			const firstUniqueId = sortedBlocks[ 0 ]?.attributes?.uniqueId;
			replaceInnerBlocks( clientId, sortedBlocks );
			setAttributes( {
				order: trackOrder,
				currentTrack:
					firstUniqueId && firstUniqueId !== currentTrack
						? firstUniqueId
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
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							showTracklist: true,
							showArtists: true,
							showNumbers: true,
							showImages: true,
							order: 'asc',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Show Tracklist' ) }
						isShownByDefault
						hasValue={ () => showTracklist !== true }
						onDeselect={ () =>
							setAttributes( { showTracklist: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show Tracklist' ) }
							onChange={ toggleAttribute( 'showTracklist' ) }
							checked={ showTracklist }
						/>
					</ToolsPanelItem>
					{ showTracklist && (
						<>
							<ToolsPanelItem
								label={ __( 'Show artist name in Tracklist' ) }
								isShownByDefault
								hasValue={ () => showArtists !== true }
								onDeselect={ () =>
									setAttributes( { showArtists: true } )
								}
							>
								<ToggleControl
									label={ __(
										'Show artist name in Tracklist'
									) }
									onChange={ toggleAttribute(
										'showArtists'
									) }
									checked={ showArtists }
								/>
							</ToolsPanelItem>
							<ToolsPanelItem
								label={ __( 'Show number in Tracklist' ) }
								isShownByDefault
								hasValue={ () => showNumbers !== true }
								onDeselect={ () =>
									setAttributes( { showNumbers: true } )
								}
							>
								<ToggleControl
									label={ __( 'Show number in Tracklist' ) }
									onChange={ toggleAttribute(
										'showNumbers'
									) }
									checked={ showNumbers }
								/>
							</ToolsPanelItem>
						</>
					) }
					<ToolsPanelItem
						label={ __( 'Show images' ) }
						isShownByDefault
						hasValue={ () => showImages !== true }
						onDeselect={ () =>
							setAttributes( { showImages: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show images' ) }
							onChange={ toggleAttribute( 'showImages' ) }
							checked={ showImages }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Order' ) }
						isShownByDefault
						hasValue={ () => order !== 'asc' }
						onDeselect={ () => setAttributes( { order: 'asc' } ) }
					>
						<SelectControl
							__next40pxDefaultSize
							label={ __( 'Order' ) }
							value={ order }
							options={ [
								{ label: __( 'Descending' ), value: 'desc' },
								{ label: __( 'Ascending' ), value: 'asc' },
							] }
							onChange={ ( value ) => onChangeOrder( value ) }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<figure { ...blockProps }>
				<Disabled isDisabled={ ! isSelected }>
					<WaveformPlayer
						src={ currentTrackData?.src }
						title={ currentTrackData?.title }
						artist={ currentTrackData?.artist }
						image={ currentTrackData?.image }
						onEnded={ onTrackEnded }
					/>
				</Disabled>
				{ showTracklist && (
					<ol
						className={ clsx( 'wp-block-playlist__tracklist', {
							'wp-block-playlist__tracklist-show-numbers':
								showNumbers,
						} ) }
					>
						{ innerBlocksProps.children }
					</ol>
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
export { getTrackAttributes };
