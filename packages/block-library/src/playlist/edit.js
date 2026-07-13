/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
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
import { __, _x } from '@wordpress/i18n';
import {
	playlist as icon,
	repeat,
	repeatAll,
	shuffle,
	skipBack,
	skipForward,
} from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { WaveformPlayer } from '../utils/waveform-player';
import { PlaylistContext } from './context';
import {
	getNextRepeatMode,
	getPlaylistPlaybackAction,
	getPlayedTracksAfterTrackSelection,
	replayWaveformPlayerTrack,
} from '../utils/waveform-utils';
import { getTrackAttributes } from './utils';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];
const DEFAULT_WAVEFORM_STYLE = 'bars';
const WAVEFORM_STYLE_OPTIONS = [
	{ label: _x( 'Bars', 'waveform style option' ), value: 'bars' },
	{ label: _x( 'Mirror', 'waveform style option' ), value: 'mirror' },
	{ label: _x( 'Line', 'waveform style option' ), value: 'line' },
	{ label: _x( 'Blocks', 'waveform style option' ), value: 'blocks' },
	{ label: _x( 'Dots', 'waveform style option' ), value: 'dots' },
	{ label: _x( 'Seekbar', 'waveform style option' ), value: 'seekbar' },
];

function PlaylistControlIcon( { icon: controlIcon } ) {
	return (
		<span className="wp-block-playlist__control-icon" aria-hidden="true">
			{ controlIcon }
		</span>
	);
}

function PlaylistPlaybackControls( {
	isShuffled,
	repeatMode,
	onPrev,
	onNext,
	onShuffleToggle,
	onRepeatToggle,
} ) {
	let repeatLabel = __( 'Repeat off' );
	let repeatIcon = repeatAll;

	if ( repeatMode === 'all' ) {
		repeatLabel = __( 'Repeat playlist' );
	} else if ( repeatMode === 'one' ) {
		repeatLabel = __( 'Repeat current track' );
		repeatIcon = repeat;
	}

	return (
		<div className="wp-block-playlist__controls">
			<div className="wp-block-playlist__controls-group">
				<button
					type="button"
					className="wp-block-playlist__control-btn"
					aria-label={ __( 'Previous track' ) }
					title={ __( 'Previous track' ) }
					onClick={ onPrev }
				>
					<PlaylistControlIcon icon={ skipBack } />
				</button>
				<button
					type="button"
					className="wp-block-playlist__control-btn"
					aria-label={ __( 'Next track' ) }
					title={ __( 'Next track' ) }
					onClick={ onNext }
				>
					<PlaylistControlIcon icon={ skipForward } />
				</button>
			</div>
			<div className="wp-block-playlist__controls-group">
				<button
					type="button"
					className="wp-block-playlist__control-btn"
					aria-pressed={ repeatMode !== 'none' }
					aria-label={ repeatLabel }
					title={ repeatLabel }
					data-repeat-mode={ repeatMode }
					onClick={ () =>
						onRepeatToggle( getNextRepeatMode( repeatMode ) )
					}
				>
					<PlaylistControlIcon icon={ repeatIcon } />
				</button>
				<button
					type="button"
					className="wp-block-playlist__control-btn"
					aria-pressed={ isShuffled }
					aria-label={ __( 'Shuffle' ) }
					title={ __( 'Shuffle' ) }
					onClick={ onShuffleToggle }
				>
					<PlaylistControlIcon icon={ shuffle } />
				</button>
			</div>
		</div>
	);
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
		showTrackLength,
		showPlaybackControls,
		waveformStyle = DEFAULT_WAVEFORM_STYLE,
	} = attributes;

	const [ isShuffled, setIsShuffled ] = useState( false );
	const [ repeatMode, setRepeatMode ] = useState( 'none' );
	const playerInstanceRef = useRef();
	// Track IDs already played in the current shuffle cycle, so no track
	// repeats until every other track has played once.
	const [ playedTracks, setPlayedTracks ] = useState( [] );
	const blockProps = useBlockProps();
	const waveformPanelId = `${ clientId }-waveform`;
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}
	const [ currentTrackClientId, setCurrentTrackClientId ] = useState( null );

	const { innerBlockTracks } = useSelect(
		( select ) => {
			const { getBlock: _getBlock } = select( blockEditorStore );
			return {
				innerBlockTracks: _getBlock( clientId )?.innerBlocks ?? [],
			};
		},
		[ clientId ]
	);

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
	const selectTrackClientId = useCallback(
		( trackClientId ) => {
			setCurrentTrackClientId( trackClientId );
			setPlayedTracks(
				getPlayedTracksAfterTrackSelection( trackClientId, isShuffled )
			);
		},
		[ isShuffled, setCurrentTrackClientId, setPlayedTracks ]
	);

	useEffect( () => {
		if ( validTracks.length === 0 ) {
			if ( currentTrackClientId !== null ) {
				setCurrentTrackClientId( null );
				setPlayedTracks( [] );
			}
			return;
		}

		const currentTrackExists = validTracks.some(
			( block ) => block.clientId === currentTrackClientId
		);
		if ( ! currentTrackExists ) {
			selectTrackClientId( validTracks[ 0 ].clientId );
		}
	}, [
		currentTrackClientId,
		selectTrackClientId,
		setCurrentTrackClientId,
		setPlayedTracks,
		validTracks,
	] );

	const playlistContext = useMemo(
		() => ( {
			currentTrackClientId,
			setCurrentTrackClientId: selectTrackClientId,
		} ),
		[ currentTrackClientId, selectTrackClientId ]
	);

	const onSelectTracks = useCallback(
		( media ) => {
			if ( ! media ) {
				return;
			}

			if ( ! Array.isArray( media ) ) {
				media = [ media ];
			}

			const trackList = media.map( getTrackAttributes );

			const newBlocks = trackList.map( ( track ) =>
				createBlock( 'core/playlist-track', track )
			);
			selectTrackClientId( newBlocks[ 0 ]?.clientId ?? null );
			// Replace the inner blocks with the new tracks.
			replaceInnerBlocks( clientId, newBlocks );
		},
		[ replaceInnerBlocks, clientId, selectTrackClientId ]
	);

	// Get current track data by finding the track with matching client ID.
	const currentTrackData =
		tracks.find( ( track ) => track.clientId === currentTrackClientId ) ??
		tracks[ 0 ];

	// Handle track end - repeat, shuffle, or advance in order.
	const onTrackEnded = useCallback(
		( playerInstance ) => {
			const { action, nextId, playedIds } = getPlaylistPlaybackAction(
				tracks.map( ( track ) => track.clientId ),
				currentTrackClientId,
				{ repeatMode, isShuffled, playedTracks }
			);
			setPlayedTracks( playedIds );
			if ( action === 'repeat' ) {
				replayWaveformPlayerTrack( playerInstance );
				return;
			}
			if ( nextId ) {
				setCurrentTrackClientId( nextId );
			}
		},
		[
			currentTrackClientId,
			tracks,
			isShuffled,
			playedTracks,
			repeatMode,
			setCurrentTrackClientId,
		]
	);

	const onPrev = useCallback( () => {
		const currentIndex = tracks.findIndex(
			( track ) => track.clientId === currentTrackClientId
		);
		const prevTrack =
			tracks[ currentIndex - 1 ] || tracks[ tracks.length - 1 ];
		if ( prevTrack?.clientId ) {
			selectTrackClientId( prevTrack.clientId );
		}
	}, [ currentTrackClientId, selectTrackClientId, tracks ] );

	const onNext = useCallback( () => {
		const { action, nextId, playedIds } = getPlaylistPlaybackAction(
			tracks.map( ( track ) => track.clientId ),
			currentTrackClientId,
			{ repeatMode, isShuffled, playedTracks, isUserInitiated: true }
		);
		setPlayedTracks( playedIds );
		if ( action === 'repeat' ) {
			replayWaveformPlayerTrack( playerInstanceRef.current );
			return;
		}
		if ( nextId ) {
			setCurrentTrackClientId( nextId );
		}
	}, [
		currentTrackClientId,
		isShuffled,
		playedTracks,
		repeatMode,
		setCurrentTrackClientId,
		tracks,
	] );

	const onPlayerChange = useCallback( ( playerInstance ) => {
		playerInstanceRef.current = playerInstance;
	}, [] );

	const onShuffleToggle = useCallback( () => {
		setIsShuffled( ( prev ) => ! prev );
		// Start a fresh shuffle cycle whenever shuffle is toggled.
		setPlayedTracks( [] );
	}, [] );

	const onRepeatToggle = useCallback( ( nextMode ) => {
		setRepeatMode( nextMode );
	}, [] );

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
			replaceInnerBlocks( clientId, sortedBlocks );
			selectTrackClientId( sortedBlocks[ 0 ]?.clientId ?? null );
			setAttributes( {
				order: trackOrder,
			} );
		},
		[
			clientId,
			innerBlockTracks,
			replaceInnerBlocks,
			selectTrackClientId,
			setAttributes,
		]
	);

	function toggleAttribute( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	const onChangeWaveformStyle = useCallback(
		( newWaveformStyle ) => {
			setAttributes( {
				waveformStyle:
					newWaveformStyle === DEFAULT_WAVEFORM_STYLE
						? undefined
						: newWaveformStyle,
			} );
		},
		[ setAttributes ]
	);

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
							showTrackLength: true,
							showImages: true,
							showPlaybackControls: true,
							order: 'asc',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Show tracklist' ) }
						isShownByDefault
						hasValue={ () => showTracklist !== true }
						onDeselect={ () =>
							setAttributes( { showTracklist: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show tracklist' ) }
							onChange={ toggleAttribute( 'showTracklist' ) }
							checked={ showTracklist }
						/>
					</ToolsPanelItem>
					{ showTracklist && (
						<>
							<ToolsPanelItem
								label={ __( 'Show artist name in tracklist' ) }
								isShownByDefault
								hasValue={ () => showArtists !== true }
								onDeselect={ () =>
									setAttributes( { showArtists: true } )
								}
							>
								<ToggleControl
									label={ __(
										'Show artist name in tracklist'
									) }
									onChange={ toggleAttribute(
										'showArtists'
									) }
									checked={ showArtists }
								/>
							</ToolsPanelItem>
							<ToolsPanelItem
								label={ __(
									'Show track numbers in tracklist'
								) }
								isShownByDefault
								hasValue={ () => showNumbers !== true }
								onDeselect={ () =>
									setAttributes( { showNumbers: true } )
								}
							>
								<ToggleControl
									label={ __(
										'Show track numbers in tracklist'
									) }
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
						label={ __( 'Show playback controls' ) }
						isShownByDefault
						hasValue={ () => showPlaybackControls === false }
						onDeselect={ () =>
							setAttributes( { showPlaybackControls: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show playback controls' ) }
							onChange={ toggleAttribute(
								'showPlaybackControls'
							) }
							checked={ showPlaybackControls !== false }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Order' ) }
						isShownByDefault
						hasValue={ () => order !== 'asc' }
						onDeselect={ () => setAttributes( { order: 'asc' } ) }
					>
						<SelectControl
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
			<InspectorControls group="styles">
				<ToolsPanel
					label={ __( 'Waveform' ) }
					resetAll={ () => {
						setAttributes( {
							waveformStyle: undefined,
						} );
					} }
					panelId={ waveformPanelId }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Shape' ) }
						isShownByDefault
						hasValue={ () =>
							waveformStyle !== DEFAULT_WAVEFORM_STYLE
						}
						onDeselect={ () =>
							onChangeWaveformStyle( DEFAULT_WAVEFORM_STYLE )
						}
						panelId={ waveformPanelId }
					>
						<SelectControl
							label={ __( 'Shape' ) }
							value={ waveformStyle }
							options={ WAVEFORM_STYLE_OPTIONS }
							onChange={ onChangeWaveformStyle }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<figure { ...blockProps }>
				<Disabled isDisabled={ ! isSelected }>
					<div
						className={ clsx( 'wp-block-playlist__player', {
							'has-playlist-controls':
								showPlaybackControls !== false,
						} ) }
					>
						<WaveformPlayer
							src={ currentTrackData?.src }
							title={ currentTrackData?.title }
							artist={ currentTrackData?.artist }
							image={
								showImages !== false
									? currentTrackData?.image
									: undefined
							}
							imageAlt={
								showImages !== false
									? currentTrackData?.imageAlt
									: undefined
							}
							waveformStyle={ waveformStyle }
							onEnded={ onTrackEnded }
							onPlayerChange={ onPlayerChange }
						/>
						{ showPlaybackControls !== false && (
							<PlaylistPlaybackControls
								isShuffled={ isShuffled }
								repeatMode={ repeatMode }
								onPrev={ onPrev }
								onNext={ onNext }
								onShuffleToggle={ onShuffleToggle }
								onRepeatToggle={ onRepeatToggle }
							/>
						) }
					</div>
				</Disabled>
				{ showTracklist && (
					<ol
						className={ clsx( 'wp-block-playlist__tracklist', {
							'wp-block-playlist__tracklist-show-numbers':
								showNumbers,
							'wp-block-playlist__tracklist-length-is-hidden':
								! showTrackLength,
						} ) }
					>
						<PlaylistContext.Provider value={ playlistContext }>
							{ innerBlocksProps.children }
						</PlaylistContext.Provider>
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
