/**
 * External dependencies
 */
import clsx from 'clsx';
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { SVG, Path } from '@wordpress/primitives';
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
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { safeHTML } from '@wordpress/dom';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';
import { getPlayerWaveSurferConfig } from './wavesurfer-utils';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

const WaveSurferPlayer = ( { trackUrl, onEnded } ) => {
	const containerRef = useRef( null );
	const wavesurferRef = useRef( null );
	const initializedRef = useRef( false );
	const [ isPlaying, setIsPlaying ] = useState( false );
	const [ isReady, setIsReady ] = useState( false );

	// Initialize WaveSurfer when component mounts

	useEffect( () => {
		if ( ! containerRef.current || initializedRef.current ) {
			return;
		}

		initializedRef.current = true;
		let wavesurfer = null;

		// Initialize WaveSurfer in the iframe's context
		const initWaveSurfer = async () => {
			const container = containerRef.current;
			if ( ! container ) {
				return;
			}

			const iframeWindow = container.ownerDocument.defaultView;
			const iframeDocument = container.ownerDocument;

			try {
				// Check if WaveSurfer is already loaded in the iframe
				if ( ! iframeWindow.WaveSurfer ) {
					// Get the WaveSurfer script URL from the main window
					const wavesurferUrl = window.wpPlaylistWaveSurferUrl;

					if ( ! wavesurferUrl ) {
						throw new Error( 'WaveSurfer script URL not found' );
					}

					// Inject WaveSurfer script into the iframe
					const script = iframeDocument.createElement( 'script' );
					script.src = wavesurferUrl;

					// Wait for the script to load
					await new Promise( ( resolve, reject ) => {
						script.onload = () => {
							// Give it a moment to initialize
							setTimeout( resolve, 50 );
						};
						script.onerror = () =>
							reject(
								new Error( 'Failed to load WaveSurfer script' )
							);
						iframeDocument.head.appendChild( script );
					} );

					// Verify WaveSurfer is available
					if ( ! iframeWindow.WaveSurfer ) {
						throw new Error(
							'WaveSurfer not available after loading script'
						);
					}
				}

				// Get the computed colors from the container
				const containerStyles =
					iframeWindow.getComputedStyle( container );
				const color = containerStyles.getPropertyValue( 'color' );
				const backgroundColor =
					containerStyles.getPropertyValue( 'background-color' );

				// Create WaveSurfer instance using the iframe's WaveSurfer
				wavesurfer = iframeWindow.WaveSurfer.create(
					getPlayerWaveSurferConfig(
						container,
						color,
						backgroundColor
					)
				);

				wavesurferRef.current = wavesurfer;
				setIsReady( true );

				// Wire up events
				wavesurfer.on( 'play', () => setIsPlaying( true ) );
				wavesurfer.on( 'pause', () => setIsPlaying( false ) );
				wavesurfer.on( 'finish', () => {
					setIsPlaying( false );
					if ( onEnded ) {
						onEnded();
					}
				} );
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error( 'Failed to initialize WaveSurfer:', error );
			}
		};

		initWaveSurfer();

		// Cleanup
		return () => {
			if ( wavesurfer ) {
				wavesurfer.destroy();
			}
		};
	}, [ onEnded ] );

	// Load track when URL changes
	useEffect( () => {
		if ( isReady && wavesurferRef.current && trackUrl ) {
			wavesurferRef.current.load( trackUrl );
		}
	}, [ trackUrl, isReady ] );

	const handlePlayPause = () => {
		if ( wavesurferRef.current ) {
			wavesurferRef.current.playPause();
		}
	};

	return (
		<div className="wp-block-playlist__player">
			<button
				className="wp-block-playlist__play-button"
				onClick={ handlePlayPause }
				aria-label={ isPlaying ? __( 'Pause' ) : __( 'Play' ) }
			>
				<span
					className="wp-block-playlist__play-icon"
					hidden={ isPlaying }
				>
					<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<Path d="M6.5 5.5v13l11-6.5z" />
					</SVG>
				</span>
				<span
					className="wp-block-playlist__pause-icon"
					hidden={ ! isPlaying }
				>
					<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<Path d="M6 5.5h4v13H6v-13zm8 0h4v13h-4v-13z" />
					</SVG>
				</span>
			</button>
			<div ref={ containerRef } className="wp-block-playlist__waveform" />
		</div>
	);
};

const CurrentTrack = ( { track, showImages } ) => {
	/**
	 * dangerouslySetInnerHTML and safeHTML are used because
	 * the media library allows using some HTML tags in the title, artist, and album fields.
	 */
	const trackTitle = {
		dangerouslySetInnerHTML: {
			__html: safeHTML( track?.title ? track.title : __( 'Untitled' ) ),
		},
	};
	const trackArtist = {
		dangerouslySetInnerHTML: {
			__html: safeHTML(
				track?.artist ? track.artist : __( 'Unknown artist' )
			),
		},
	};
	const trackAlbum = {
		dangerouslySetInnerHTML: {
			__html: safeHTML(
				track?.album ? track.album : __( 'Unknown album' )
			),
		},
	};

	return (
		<div className="wp-block-playlist__current-item">
			{ showImages && track?.image && (
				<img
					className="wp-block-playlist__item-image"
					src={ track.image }
					alt=""
					width="70"
					height="70"
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
						{ ...trackTitle }
					/>
				) }
				<div className="wp-block-playlist__current-item-artist-album">
					<span
						className="wp-block-playlist__item-artist"
						{ ...trackArtist }
					/>
					<span
						className="wp-block-playlist__item-album"
						{ ...trackAlbum }
					/>
				</div>
			</div>
		</div>
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

			const trackAttributes = ( track ) => ( {
				id: track.id || track.url, // Attachment ID or URL.
				uniqueId: uuid(), // Unique ID for the track.
				src: track.url,
				title: track.title,
				artist:
					track.artist ||
					track?.meta?.artist ||
					track?.media_details?.artist ||
					__( 'Unknown artist' ),
				album:
					track.album ||
					track?.meta?.album ||
					track?.media_details?.album ||
					__( 'Unknown album' ),
				length:
					track?.fileLength || track?.media_details?.length_formatted,
				// Prevent using the default media attachment icon as the track image.
				// Note: Image is not available when a new track is uploaded.
				image:
					track?.image?.src &&
					track?.image?.src.endsWith( '/images/media/audio.svg' )
						? ''
						: track?.image?.src,
			} );

			const trackList = media.map( trackAttributes );
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

	const onTrackEnd = useCallback( () => {
		/* If there are tracks left, play the next track */
		if ( trackListIndex < tracks.length - 1 ) {
			if ( tracks[ trackListIndex + 1 ]?.uniqueId ) {
				setTrackListIndex( trackListIndex + 1 );
				setAttributes( {
					currentTrack: tracks[ trackListIndex + 1 ].uniqueId,
				} );
			}
		} else {
			setTrackListIndex( 0 );
			if ( tracks[ 0 ].uniqueId ) {
				setAttributes( { currentTrack: tracks[ 0 ].uniqueId } );
			} else if ( tracks.length > 0 ) {
				const validTrack = tracks.find(
					( track ) => track.uniqueId !== undefined
				);
				if ( validTrack ) {
					setAttributes( { currentTrack: validTrack.uniqueId } );
				}
			}
		}
	}, [ setAttributes, trackListIndex, tracks ] );

	const onChangeOrder = useCallback(
		( trackOrder ) => {
			const sortedBlocks = [ ...innerBlockTracks ].sort( ( a, b ) => {
				if ( trackOrder === 'ASC' ) {
					return a.attributes.uniqueId.localeCompare(
						b.attributes.uniqueId
					);
				}
				return b.attributes.uniqueId.localeCompare(
					a.attributes.uniqueId
				);
			} );
			const sortedTracks = sortedBlocks.map(
				( block ) => block.attributes
			);
			replaceInnerBlocks( clientId, sortedBlocks );
			setAttributes( {
				order: trackOrder,
				currentTrack:
					sortedTracks.length > 0 &&
					sortedTracks[ 0 ].uniqueId !== currentTrack
						? sortedTracks[ 0 ].uniqueId
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
				<WaveSurferPlayer
					trackUrl={ tracks[ trackListIndex ]?.src || '' }
					onEnded={ onTrackEnd }
				/>
				<Disabled isDisabled={ ! isSelected }>
					<CurrentTrack
						track={ tracks[ trackListIndex ] }
						showImages={ showImages }
					/>
				</Disabled>
				{ showTracklist && (
					<TagName className="wp-block-playlist__tracklist">
						{ innerBlocksProps.children }
					</TagName>
				) }
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
