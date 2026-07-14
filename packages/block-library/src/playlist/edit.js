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
	InspectorControls,
	InnerBlocks,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
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
import { playlist as icon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { WaveformPlayer } from '../utils/waveform-player';
import { PlaylistContext } from './context';
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
		showPlayButtonArtwork,
		showArtists,
		showTrackLength,
		waveformStyle = DEFAULT_WAVEFORM_STYLE,
		waveformColor,
		waveformGradient,
		waveformBackgroundColor,
		waveformBackgroundGradient,
	} = attributes;

	const blockProps = useBlockProps();
	const waveformPanelId = `${ clientId }-waveform`;
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const colorGradientSettings = useMultipleOriginColorsAndGradients();
	const colors = useMemo(
		() =>
			colorGradientSettings.colors.flatMap(
				( origin ) => origin?.colors ?? []
			),
		[ colorGradientSettings.colors ]
	);
	const gradients = useMemo(
		() =>
			colorGradientSettings.gradients.flatMap(
				( origin ) => origin?.gradients ?? []
			),
		[ colorGradientSettings.gradients ]
	);
	const hasColors =
		colors.length > 0 || ! colorGradientSettings.disableCustomColors;
	const hasGradients =
		gradients.length > 0 || ! colorGradientSettings.disableCustomGradients;
	const waveformGradientValue = waveformGradient;
	const waveformBackgroundGradientValue = waveformBackgroundGradient;
	let waveformColorGradientChange;
	let waveformBackgroundColorGradientChange;
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

	const playlistContext = useMemo(
		() => ( { currentTrackClientId, setCurrentTrackClientId } ),
		[ currentTrackClientId, setCurrentTrackClientId ]
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
			setCurrentTrackClientId( newBlocks[ 0 ]?.clientId ?? null );
			// Replace the inner blocks with the new tracks.
			replaceInnerBlocks( clientId, newBlocks );
		},
		[ replaceInnerBlocks, clientId, setCurrentTrackClientId ]
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
			setCurrentTrackClientId( sortedBlocks[ 0 ]?.clientId ?? null );
			setAttributes( {
				order: trackOrder,
			} );
		},
		[
			clientId,
			innerBlockTracks,
			replaceInnerBlocks,
			setAttributes,
			setCurrentTrackClientId,
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

	function updateWaveformColor( colorValue ) {
		const isSettingColor = colorValue !== undefined;
		if ( ! isSettingColor && waveformColorGradientChange === 'gradient' ) {
			waveformColorGradientChange = undefined;
			return;
		}

		waveformColorGradientChange = 'color';

		setAttributes( {
			waveformColor: colorValue,
			waveformGradient: undefined,
		} );
	}

	function updateWaveformGradient( gradientValue ) {
		const isSettingGradient = gradientValue !== undefined;
		if ( ! isSettingGradient && waveformColorGradientChange === 'color' ) {
			waveformColorGradientChange = undefined;
			return;
		}

		waveformColorGradientChange = 'gradient';

		setAttributes( {
			waveformGradient: gradientValue,
			waveformColor: undefined,
		} );
	}

	function updateWaveformBackgroundColor( colorValue ) {
		const isSettingColor = colorValue !== undefined;
		if (
			! isSettingColor &&
			waveformBackgroundColorGradientChange === 'gradient'
		) {
			waveformBackgroundColorGradientChange = undefined;
			return;
		}

		waveformBackgroundColorGradientChange = 'color';

		setAttributes( {
			waveformBackgroundColor: colorValue,
			waveformBackgroundGradient: undefined,
		} );
	}

	function updateWaveformBackgroundGradient( gradientValue ) {
		const isSettingGradient = gradientValue !== undefined;
		if (
			! isSettingGradient &&
			waveformBackgroundColorGradientChange === 'color'
		) {
			waveformBackgroundColorGradientChange = undefined;
			return;
		}

		waveformBackgroundColorGradientChange = 'gradient';

		setAttributes( {
			waveformBackgroundGradient: gradientValue,
			waveformBackgroundColor: undefined,
		} );
	}

	const hasSelectedChild = useSelect(
		( select ) =>
			select( blockEditorStore ).hasSelectedInnerBlock( clientId ),
		[ clientId ]
	);

	const hasAnySelected = isSelected || hasSelectedChild;

	const colorSettings = [];
	if ( hasColors || hasGradients ) {
		colorSettings.push(
			{
				colorValue: hasColors ? waveformColor : undefined,
				gradientValue: hasGradients ? waveformGradientValue : undefined,
				label: __( 'Waveform & Play button' ),
				onColorChange: hasColors ? updateWaveformColor : undefined,
				onGradientChange: hasGradients
					? updateWaveformGradient
					: undefined,
				isShownByDefault: true,
				clearable: true,
				enableAlpha: true,
				resetAllFilter: () => ( {
					waveformColor: undefined,
					waveformGradient: undefined,
				} ),
			},
			{
				colorValue: hasColors ? waveformBackgroundColor : undefined,
				gradientValue: hasGradients
					? waveformBackgroundGradientValue
					: undefined,
				label: __( 'Waveform background' ),
				onColorChange: hasColors
					? updateWaveformBackgroundColor
					: undefined,
				onGradientChange: hasGradients
					? updateWaveformBackgroundGradient
					: undefined,
				isShownByDefault: true,
				clearable: true,
				enableAlpha: true,
				resetAllFilter: () => ( {
					waveformBackgroundColor: undefined,
					waveformBackgroundGradient: undefined,
				} ),
			}
		);
	}

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
							showPlayButtonArtwork: false,
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
								label={ __(
									'Show track duration in tracklist'
								) }
								isShownByDefault
								hasValue={ () => showTrackLength !== true }
								onDeselect={ () =>
									setAttributes( { showTrackLength: true } )
								}
							>
								<ToggleControl
									label={ __(
										'Show track duration in tracklist'
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
						label={ __( 'Show tracklist images' ) }
						isShownByDefault
						hasValue={ () => showImages !== true }
						onDeselect={ () =>
							setAttributes( { showImages: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show tracklist images' ) }
							onChange={ toggleAttribute( 'showImages' ) }
							checked={ showImages }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Show track image on play button' ) }
						isShownByDefault
						hasValue={ () => showPlayButtonArtwork === true }
						onDeselect={ () =>
							setAttributes( { showPlayButtonArtwork: false } )
						}
					>
						<ToggleControl
							label={ __( 'Show track image on play button' ) }
							onChange={ toggleAttribute(
								'showPlayButtonArtwork'
							) }
							checked={ showPlayButtonArtwork === true }
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
							waveformColor: undefined,
							waveformGradient: undefined,
							waveformBackgroundColor: undefined,
							waveformBackgroundGradient: undefined,
						} );
					} }
					panelId={ waveformPanelId }
					dropdownMenuProps={ dropdownMenuProps }
				>
					{ colorSettings.length > 0 && (
						<div className="wp-block-playlist__waveform-color-controls">
							<ColorGradientSettingsDropdown
								__experimentalIsRenderedInSidebar
								settings={ colorSettings }
								panelId={ waveformPanelId }
								{ ...colorGradientSettings }
							/>
						</div>
					) }
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
					<WaveformPlayer
						src={ currentTrackData?.src }
						title={ currentTrackData?.title }
						artist={ currentTrackData?.artist }
						image={ currentTrackData?.image }
						imageAlt={ currentTrackData?.imageAlt }
						waveformStyle={ waveformStyle }
						color={ waveformColor }
						gradient={ waveformGradientValue }
						backgroundColor={ waveformBackgroundColor }
						backgroundGradient={ waveformBackgroundGradientValue }
						onEnded={ onTrackEnded }
						showPlayButtonArtwork={ showPlayButtonArtwork === true }
					/>
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
