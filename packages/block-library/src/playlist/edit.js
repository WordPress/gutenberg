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
	withColors,
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
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
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
	{ label: __( 'Bars' ), value: 'bars' },
	{ label: __( 'Mirror' ), value: 'mirror' },
	{ label: __( 'Line' ), value: 'line' },
	{ label: __( 'Blocks' ), value: 'blocks' },
	{ label: __( 'Dots' ), value: 'dots' },
	{ label: __( 'Seekbar' ), value: 'seekbar' },
];
const WAVEFORM_STYLE_VALUES = WAVEFORM_STYLE_OPTIONS.map(
	( { value } ) => value
);
const WAVEFORM_STYLE_CLASS_PREFIX = 'waveform-style--';

function getWaveformStyleClassName( waveformStyle ) {
	return `${ WAVEFORM_STYLE_CLASS_PREFIX }${ waveformStyle }`;
}

function getWaveformStyleFromClassNamePart( classNamePart, prefix ) {
	if ( ! classNamePart.startsWith( prefix ) ) {
		return;
	}

	const waveformStyle = classNamePart.slice( prefix.length );
	return WAVEFORM_STYLE_VALUES.includes( waveformStyle )
		? waveformStyle
		: undefined;
}

function getWaveformStyleFromClassNames( classNames, prefix ) {
	return classNames
		.map( ( classNamePart ) =>
			getWaveformStyleFromClassNamePart( classNamePart, prefix )
		)
		.find( Boolean );
}

function getClassNames( className = '' ) {
	return className.split( /\s+/ ).filter( Boolean );
}

function getWaveformStyleFromClassName( className ) {
	const classNames = getClassNames( className );
	return getWaveformStyleFromClassNames(
		classNames,
		WAVEFORM_STYLE_CLASS_PREFIX
	);
}

function isWaveformStyle( waveformStyle ) {
	return WAVEFORM_STYLE_VALUES.includes( waveformStyle );
}

function removeWaveformStyleClasses( className ) {
	const nextClassName = getClassNames( className )
		.filter(
			( classNamePart ) =>
				! classNamePart.startsWith( WAVEFORM_STYLE_CLASS_PREFIX )
		)
		.join( ' ' );

	return nextClassName || undefined;
}

function getClassNameWithWaveformStyle( className, waveformStyle ) {
	const classNames = getClassNames( removeWaveformStyleClasses( className ) );

	if ( waveformStyle !== DEFAULT_WAVEFORM_STYLE ) {
		classNames.push( getWaveformStyleClassName( waveformStyle ) );
	}

	return classNames.join( ' ' ) || undefined;
}

const PlaylistEdit = ( {
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
	clientId,
	waveformColor,
	setWaveformColor,
	waveformBackgroundColor,
	setWaveformBackgroundColor,
} ) => {
	const {
		order,
		showTracklist,
		showNumbers,
		showImages,
		showArtists,
		showTrackLength,
		waveformStyle: waveformStyleAttribute,
		waveformColorValue,
		waveformBackgroundColorValue,
	} = attributes;

	const waveformStyle = isWaveformStyle( waveformStyleAttribute )
		? waveformStyleAttribute
		: getWaveformStyleFromClassName( attributes.className ) ||
		  DEFAULT_WAVEFORM_STYLE;
	const blockProps = useBlockProps();
	const colorGradientSettings = useMultipleOriginColorsAndGradients();
	const resolvedWaveformColor = waveformColor.color || waveformColorValue;
	const resolvedWaveformBackgroundColor =
		waveformBackgroundColor.color || waveformBackgroundColorValue;
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
		( nextWaveformStyle ) => {
			const nextStyle = isWaveformStyle( nextWaveformStyle )
				? nextWaveformStyle
				: DEFAULT_WAVEFORM_STYLE;

			setAttributes( {
				waveformStyle:
					nextStyle === DEFAULT_WAVEFORM_STYLE
						? undefined
						: nextStyle,
				className: getClassNameWithWaveformStyle(
					attributes.className,
					nextStyle
				),
			} );
		},
		[ attributes.className, setAttributes ]
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
						setWaveformColor( undefined );
						setWaveformBackgroundColor( undefined );
						setAttributes( {
							waveformStyle: undefined,
							className: removeWaveformStyleClasses(
								attributes.className
							),
							waveformColorValue: undefined,
							waveformBackgroundColorValue: undefined,
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
					{ colorGradientSettings.hasColorsOrGradients && (
						<ColorGradientSettingsDropdown
							__experimentalIsRenderedInSidebar
							settings={ [
								{
									colorValue: resolvedWaveformColor,
									label: __( 'Color' ),
									onColorChange: ( colorValue ) => {
										setWaveformColor( colorValue );
										setAttributes( {
											waveformColorValue: colorValue,
										} );
									},
									isShownByDefault: true,
									resetAllFilter: () => {
										setWaveformColor( undefined );
										setAttributes( {
											waveformColorValue: undefined,
										} );
									},
									enableAlpha: true,
									clearable: true,
								},
								{
									colorValue: resolvedWaveformBackgroundColor,
									label: __( 'Background' ),
									onColorChange: ( colorValue ) => {
										setWaveformBackgroundColor(
											colorValue
										);
										setAttributes( {
											waveformBackgroundColorValue:
												colorValue,
										} );
									},
									isShownByDefault: true,
									resetAllFilter: () => {
										setWaveformBackgroundColor( undefined );
										setAttributes( {
											waveformBackgroundColorValue:
												undefined,
										} );
									},
									enableAlpha: true,
									clearable: true,
								},
							] }
							panelId={ waveformPanelId }
							{ ...colorGradientSettings }
						/>
					) }
				</ToolsPanel>
			</InspectorControls>
			<figure { ...blockProps }>
				<Disabled isDisabled={ ! isSelected }>
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
						color={ resolvedWaveformColor }
						backgroundColor={ resolvedWaveformBackgroundColor }
						waveformStyle={ waveformStyle }
						onEnded={ onTrackEnded }
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

export default withColors(
	{ waveformColor: 'color' },
	{ waveformBackgroundColor: 'background-color' }
)( PlaylistEdit );
