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
} from '@wordpress/block-editor';
import {
	ToggleControl,
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
import { getTrackAttributes } from './utils';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];
const PLAYLIST_TEMPLATE = [
	[ 'core/playlist-waveform' ],
	[ 'core/playlist-tracklist' ],
];

const getTrackBlocks = ( innerBlocks ) => {
	const tracklist = innerBlocks.find(
		( block ) => block.name === 'core/playlist-tracklist'
	);
	return (
		tracklist?.innerBlocks ??
		innerBlocks.filter( ( block ) => block.name === 'core/playlist-track' )
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
		order,
		showTracklist,
		showNumbers,
		showImages,
		showArtists,
		showTrackLength,
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

	const { innerBlocks, innerBlockTracks, tracklistClientId } = useSelect(
		( select ) => {
			const { getBlock: _getBlock } = select( blockEditorStore );
			const block = _getBlock( clientId );
			const playlistInnerBlocks = block?.innerBlocks ?? [];
			const tracklistBlock = playlistInnerBlocks.find(
				( innerBlock ) =>
					innerBlock.name === 'core/playlist-tracklist'
			);
			return {
				innerBlocks: playlistInnerBlocks,
				innerBlockTracks: getTrackBlocks( playlistInnerBlocks ),
				tracklistClientId: tracklistBlock?.clientId,
			};
		},
		[ clientId ]
	);

	// Reuse an existing waveform block when present so its style variation is
	// preserved; otherwise create one, migrating any is-style-* class from the
	// playlist (older markup stored the waveform style on the playlist itself).
	const resolveWaveformBlock = useCallback(
		( existingWaveform ) =>
			existingWaveform ??
			createBlock( 'core/playlist-waveform', {
				className: attributes.className?.match(
					/is-style-[\w-]+/
				)?.[ 0 ],
			} ),
		[ attributes.className ]
	);

	// Keep the playlist structure normalized. Older playlist markup had track
	// blocks directly inside the playlist; new markup stores them in a
	// dedicated tracklist child so the waveform can be styled independently.
	useEffect( () => {
		if ( innerBlocks.length === 0 ) {
			return;
		}

		const waveformBlock = innerBlocks.find(
			( block ) => block.name === 'core/playlist-waveform'
		);
		const tracklistBlock = innerBlocks.find(
			( block ) => block.name === 'core/playlist-tracklist'
		);
		const directTrackBlocks = innerBlocks.filter(
			( block ) => block.name === 'core/playlist-track'
		);

		if (
			waveformBlock &&
			tracklistBlock &&
			directTrackBlocks.length === 0
		) {
			return;
		}

		const normalizedTrackBlocks = [
			...( tracklistBlock?.innerBlocks ?? [] ),
			...directTrackBlocks,
		];

		replaceInnerBlocks( clientId, [
			resolveWaveformBlock( waveformBlock ),
			createBlock(
				'core/playlist-tracklist',
				tracklistBlock?.attributes ?? {},
				normalizedTrackBlocks
			),
		] );
	}, [ clientId, innerBlocks, replaceInnerBlocks, resolveWaveformBlock ] );

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
			replaceInnerBlocks( tracklistClientId ?? clientId, updatedBlocks );
		}
	}, [
		innerBlockTracks,
		clientId,
		replaceInnerBlocks,
		tracklistClientId,
	] );

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
			const existingWaveform = innerBlocks.find(
				( block ) => block.name === 'core/playlist-waveform'
			);
			replaceInnerBlocks( clientId, [
				resolveWaveformBlock( existingWaveform ),
				createBlock( 'core/playlist-tracklist', {}, newBlocks ),
			] );
		},
		[
			__unstableMarkNextChangeAsNotPersistent,
			setAttributes,
			replaceInnerBlocks,
			clientId,
			innerBlocks,
			resolveWaveformBlock,
		]
	);

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
			replaceInnerBlocks( tracklistClientId ?? clientId, sortedBlocks );
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
			tracklistClientId,
		]
	);

	function toggleAttribute( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			allowedBlocks: [
				'core/playlist-waveform',
				'core/playlist-tracklist',
			],
			template: PLAYLIST_TEMPLATE,
			templateLock: 'all',
		}
	);

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
							showTrackLength: true,
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
							<ToolsPanelItem
								label={ __( 'Show track length in Tracklist' ) }
								isShownByDefault
								hasValue={ () => showTrackLength !== true }
								onDeselect={ () =>
									setAttributes( { showTrackLength: true } )
								}
							>
								<ToggleControl
									label={ __(
										'Show track length in Tracklist'
									) }
									onChange={ toggleAttribute(
										'showTrackLength'
									) }
									checked={ showTrackLength }
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
				<div { ...innerBlocksProps } />
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
