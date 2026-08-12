import clsx from 'clsx';
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
import { __, _x, sprintf } from '@wordpress/i18n';
import { playlist as icon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';
import { createBlobURL } from '@wordpress/blob';
import { Caption } from '../utils/caption';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { WaveformPlayer } from '../utils/waveform-player';
import { PlaylistContext } from './context';
import { getTrackAttributes, getTrackImageAttributes } from './utils';
import {
	debugPlaylistZip,
	getPlaylistMediaFromZip,
	getPlaylistZipDebugMediaInfo,
	isZipFile,
} from './zip-utils';

const ALLOWED_PLAYLIST_MEDIA_TYPES = [
	'audio',
	'application/zip',
	'application/x-zip',
	'application/x-zip-compressed',
];
const ZIP_UPLOAD_MEDIA_TYPES = [ 'audio', 'image' ];
const AUDIO_FILE_EXTENSION =
	/\.(aac|aif|aiff|flac|m4a|m4b|mp3|oga|ogg|opus|wav|weba)$/i;
const AUDIO_AND_ZIP_ACCEPT =
	'audio/*,.zip,application/zip,application/x-zip,application/x-zip-compressed';
const DEFAULT_WAVEFORM_STYLE = 'bars';
const FILE_LIST_OBJECT_NAME = '[object FileList]';
const WAVEFORM_STYLE_OPTIONS = [
	{ label: _x( 'Bars', 'waveform style option' ), value: 'bars' },
	{ label: _x( 'Mirror', 'waveform style option' ), value: 'mirror' },
	{ label: _x( 'Line', 'waveform style option' ), value: 'line' },
	{ label: _x( 'Blocks', 'waveform style option' ), value: 'blocks' },
	{ label: _x( 'Dots', 'waveform style option' ), value: 'dots' },
	{ label: _x( 'Seekbar', 'waveform style option' ), value: 'seekbar' },
];

function isFile( value ) {
	return (
		Object.prototype.toString.call( value ) === '[object File]' ||
		( typeof File !== 'undefined' && value instanceof File )
	);
}

function isAudioFile( file ) {
	return file.type
		? file.type.startsWith( 'audio/' )
		: AUDIO_FILE_EXTENSION.test( file.name );
}

function getTrackIdentifier( track ) {
	return track.id ?? track.src ?? track.blob;
}

function getErrorMessage( error ) {
	return typeof error === 'string' ? error : error?.message;
}

function getMediaUrl( media ) {
	return media?.url ?? media?.source_url;
}

function getMediaMimeType( media ) {
	return media?.mime_type ?? media?.mime ?? media?.type;
}

function isAudioMediaItem( media ) {
	const mimeType = getMediaMimeType( media );
	const mediaUrl = getMediaUrl( media );

	return (
		mimeType === 'audio' ||
		mimeType?.startsWith( 'audio/' ) ||
		AUDIO_FILE_EXTENSION.test( media?.filename ?? '' ) ||
		AUDIO_FILE_EXTENSION.test( media?.file ?? '' ) ||
		AUDIO_FILE_EXTENSION.test( mediaUrl ?? '' )
	);
}

function getMediaItems( media ) {
	if ( ! media ) {
		return [];
	}

	if ( Object.prototype.toString.call( media ) === FILE_LIST_OBJECT_NAME ) {
		return Array.from( media );
	}

	return Array.isArray( media ) ? media : [ media ];
}

function getZipFileName( media ) {
	return (
		media?.filename ||
		media?.file ||
		media?.name ||
		getMediaUrl( media )?.split( /[/\\]/ ).pop() ||
		'playlist.zip'
	);
}

async function getZipFile( media ) {
	if ( isFile( media ) ) {
		debugPlaylistZip(
			'using selected ZIP file object',
			getPlaylistZipDebugMediaInfo( media )
		);
		return media;
	}

	const mediaUrl = getMediaUrl( media );
	if ( ! mediaUrl ) {
		debugPlaylistZip( 'selected ZIP attachment is missing a URL', {
			media: getPlaylistZipDebugMediaInfo( media ),
		} );
		throw new Error( __( 'The ZIP file is missing a URL.' ) );
	}

	debugPlaylistZip( 'fetching selected ZIP attachment', {
		media: getPlaylistZipDebugMediaInfo( media ),
	} );
	const response = await window.fetch( mediaUrl );
	if ( ! response.ok ) {
		debugPlaylistZip( 'selected ZIP attachment fetch failed', {
			status: response.status,
			statusText: response.statusText,
			media: getPlaylistZipDebugMediaInfo( media ),
		} );
		throw new Error( response.statusText );
	}

	const blob = await response.blob();
	const file = new File(
		[ blob ],
		getZipFileName( media ).split( /[/\\]/ ).pop(),
		{
			type: blob.type || getMediaMimeType( media ) || 'application/zip',
		}
	);
	debugPlaylistZip( 'fetched selected ZIP attachment', {
		media: getPlaylistZipDebugMediaInfo( media ),
		file: getPlaylistZipDebugMediaInfo( file ),
	} );
	return file;
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
	const { replaceInnerBlocks, selectBlock } = useDispatch( blockEditorStore );
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
	const onUploadError = useCallback(
		( message ) => {
			createErrorNotice( message, { type: 'snackbar' } );
		},
		[ createErrorNotice ]
	);
	const [ currentTrackClientId, setCurrentTrackClientId ] = useState( null );

	const { innerBlockTracks, mediaUpload } = useSelect(
		( select ) => {
			const { getBlock: _getBlock } = select( blockEditorStore );
			const { mediaUpload: _mediaUpload } =
				select( blockEditorStore ).getSettings();
			return {
				innerBlockTracks: _getBlock( clientId )?.innerBlocks ?? [],
				mediaUpload: _mediaUpload,
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

	const createTrackBlocks = useCallback(
		( media ) => {
			const mediaItems = getMediaItems( media );
			let hasInvalidFile = false;

			const blocks = mediaItems
				.map( ( mediaItem ) => {
					if ( isFile( mediaItem ) ) {
						if ( ! isAudioFile( mediaItem ) ) {
							hasInvalidFile = true;
							return null;
						}

						return createBlock( 'core/playlist-track', {
							blob: createBlobURL( mediaItem ),
							title: mediaItem.name,
						} );
					}

					if ( ! isAudioMediaItem( mediaItem ) ) {
						hasInvalidFile = true;
						return null;
					}

					const track = getTrackAttributes( mediaItem );
					return track.src
						? createBlock( 'core/playlist-track', track )
						: null;
				} )
				.filter( Boolean );

			if ( hasInvalidFile ) {
				onUploadError(
					__(
						'Only audio files and ZIP files can be added to a playlist.'
					)
				);
			}

			return blocks;
		},
		[ onUploadError ]
	);

	const uploadZipMediaFile = useCallback(
		( file ) =>
			new Promise( ( resolve, reject ) => {
				debugPlaylistZip( 'uploading extracted ZIP file', {
					file: getPlaylistZipDebugMediaInfo( file ),
				} );
				if ( ! mediaUpload ) {
					debugPlaylistZip( 'extracted ZIP file upload unavailable', {
						file: getPlaylistZipDebugMediaInfo( file ),
					} );
					reject(
						__(
							'The ZIP file could not be uploaded because media uploads are unavailable.'
						)
					);
					return;
				}

				let isComplete = false;
				const resolveWhenComplete = ( attachments ) => {
					debugPlaylistZip( 'extracted ZIP file upload changed', {
						file: getPlaylistZipDebugMediaInfo( file ),
						attachments: Array.isArray( attachments )
							? attachments.map( getPlaylistZipDebugMediaInfo )
							: attachments,
					} );
					if ( isComplete ) {
						return;
					}

					if ( ! Array.isArray( attachments ) ) {
						return;
					}

					const attachment = attachments.find( ( item ) => item?.id );
					if ( attachment ) {
						isComplete = true;
						debugPlaylistZip(
							'extracted ZIP file upload resolved',
							{
								file: getPlaylistZipDebugMediaInfo( file ),
								attachment:
									getPlaylistZipDebugMediaInfo( attachment ),
							}
						);
						resolve( attachment );
					}
				};

				mediaUpload( {
					allowedTypes: ZIP_UPLOAD_MEDIA_TYPES,
					filesList: [ file ],
					multiple: false,
					onFileChange: resolveWhenComplete,
					onSuccess: resolveWhenComplete,
					onError: ( message ) => {
						debugPlaylistZip( 'extracted ZIP file upload failed', {
							file: getPlaylistZipDebugMediaInfo( file ),
							message,
						} );
						reject(
							message ||
								__( 'The ZIP file could not be uploaded.' )
						);
					},
				} );
			} ),
		[ mediaUpload ]
	);

	const uploadZipMedia = useCallback(
		async ( filesList ) => {
			const attachments = [];
			const errors = [];

			for ( const file of filesList ) {
				try {
					attachments.push( await uploadZipMediaFile( file ) );
				} catch ( error ) {
					attachments.push( null );
					errors.push( {
						file,
						message: getErrorMessage( error ),
					} );
				}
			}

			debugPlaylistZip( 'extracted ZIP file upload batch complete', {
				fileCount: filesList.length,
				uploadedCount: attachments.filter( Boolean ).length,
				errors: errors.map( ( error ) => ( {
					file: getPlaylistZipDebugMediaInfo( error.file ),
					message: error.message,
				} ) ),
			} );

			return { attachments, errors };
		},
		[ uploadZipMediaFile ]
	);

	const createTrackBlocksFromZip = useCallback(
		async ( zipFile ) => {
			let zipMedia;
			try {
				debugPlaylistZip( 'creating playlist tracks from ZIP', {
					zip: getPlaylistZipDebugMediaInfo( zipFile ),
				} );
				zipMedia = await getPlaylistMediaFromZip(
					await getZipFile( zipFile )
				);
				debugPlaylistZip( 'parsed ZIP playlist media', {
					trackCount: zipMedia.tracks.length,
					tracks: zipMedia.tracks.map( ( track ) => ( {
						file: getPlaylistZipDebugMediaInfo( track.file ),
						details: track.details,
					} ) ),
					imageFile: getPlaylistZipDebugMediaInfo(
						zipMedia.imageFile
					),
				} );
			} catch ( error ) {
				const message = getErrorMessage( error );
				debugPlaylistZip( 'reading ZIP failed', {
					zip: getPlaylistZipDebugMediaInfo( zipFile ),
					message,
				} );
				onUploadError(
					message
						? sprintf(
								// translators: %s: Error message.
								__( 'The ZIP file could not be read: %s' ),
								message
						  )
						: __( 'The ZIP file could not be read.' )
				);
				return [];
			}

			if ( zipMedia.tracks.length === 0 ) {
				debugPlaylistZip( 'ZIP contained no audio tracks', {
					zip: getPlaylistZipDebugMediaInfo( zipFile ),
				} );
				onUploadError(
					__( 'The ZIP file does not contain any audio files.' )
				);
				return [];
			}

			const { attachments, errors } = await uploadZipMedia(
				zipMedia.tracks.map( ( track ) => track.file )
			);
			const uploadedTrackCount = attachments.filter( Boolean ).length;

			if ( uploadedTrackCount === 0 ) {
				const message = errors[ 0 ]?.message;
				onUploadError(
					message
						? sprintf(
								// translators: %s: Error message.
								__( 'The ZIP file could not be uploaded: %s' ),
								message
						  )
						: __( 'The ZIP file could not be uploaded.' )
				);
				return [];
			}

			if ( errors.length > 0 ) {
				onUploadError(
					sprintf(
						// translators: %s: Error message.
						__(
							'Some tracks from the ZIP file could not be uploaded: %s'
						),
						errors[ 0 ].message || errors[ 0 ].file.name
					)
				);
			}

			let coverImage = {};
			if ( zipMedia.imageFile ) {
				try {
					coverImage = getTrackImageAttributes(
						await uploadZipMediaFile( zipMedia.imageFile )
					);
					debugPlaylistZip( 'uploaded ZIP cover image', {
						imageFile: getPlaylistZipDebugMediaInfo(
							zipMedia.imageFile
						),
						coverImage,
					} );
				} catch ( error ) {
					const message = getErrorMessage( error );
					debugPlaylistZip( 'ZIP cover image upload failed', {
						imageFile: getPlaylistZipDebugMediaInfo(
							zipMedia.imageFile
						),
						message,
					} );
					onUploadError(
						message
							? sprintf(
									// translators: %s: Error message.
									__(
										'The cover image from the ZIP file could not be uploaded: %s'
									),
									message
							  )
							: __(
									'The cover image from the ZIP file could not be uploaded.'
							  )
					);
				}
			}

			return zipMedia.tracks
				.map( ( track, index ) => {
					const attachment = attachments[ index ];
					if ( ! attachment ) {
						debugPlaylistZip(
							'skipped ZIP track without uploaded attachment',
							{
								track: {
									file: getPlaylistZipDebugMediaInfo(
										track.file
									),
									details: track.details,
								},
							}
						);
						return null;
					}

					const { trackNumber, ...trackDetails } = track.details;

					return createBlock( 'core/playlist-track', {
						...getTrackAttributes( attachment ),
						...trackDetails,
						...coverImage,
					} );
				} )
				.filter( Boolean );
		},
		[ onUploadError, uploadZipMedia, uploadZipMediaFile ]
	);

	const createTrackBlocksFromMedia = useCallback(
		async ( media ) => {
			const mediaItems = getMediaItems( media );
			const mediaItemsWithType = mediaItems.map( ( mediaItem ) => ( {
				mediaItem,
				isZip: isZipFile( mediaItem ),
			} ) );
			debugPlaylistZip( 'selected playlist media', {
				items: mediaItemsWithType.map( ( { mediaItem, isZip } ) => ( {
					media: getPlaylistZipDebugMediaInfo( mediaItem ),
					isZip,
					isAudio: isFile( mediaItem )
						? isAudioFile( mediaItem )
						: isAudioMediaItem( mediaItem ),
				} ) ),
			} );
			const blocks = createTrackBlocks(
				mediaItemsWithType
					.filter( ( { isZip } ) => ! isZip )
					.map( ( { mediaItem } ) => mediaItem )
			);
			const zipFiles = mediaItemsWithType
				.filter( ( { isZip } ) => isZip )
				.map( ( { mediaItem } ) => mediaItem );

			if ( zipFiles.length === 0 ) {
				debugPlaylistZip( 'selected media had no ZIP files', {
					blockCount: blocks.length,
				} );
				return blocks;
			}

			const zipBlocks = await Promise.all(
				zipFiles.map( createTrackBlocksFromZip )
			);

			const newBlocks = [ ...blocks, ...zipBlocks.flat() ];
			debugPlaylistZip( 'created playlist blocks from selected media', {
				blockCount: newBlocks.length,
				zipBlockCount: zipBlocks.flat().length,
				regularBlockCount: blocks.length,
			} );
			return newBlocks;
		},
		[ createTrackBlocks, createTrackBlocksFromZip ]
	);

	const onSelectTracks = useCallback(
		async ( media ) => {
			const newBlocks = await createTrackBlocksFromMedia( media );
			if ( newBlocks.length === 0 ) {
				return;
			}

			setCurrentTrackClientId( newBlocks[ 0 ]?.clientId ?? null );
			// Replace the inner blocks with the new tracks.
			replaceInnerBlocks( clientId, newBlocks );
		},
		[
			clientId,
			createTrackBlocksFromMedia,
			replaceInnerBlocks,
			setCurrentTrackClientId,
		]
	);

	const onAddTracks = useCallback(
		async ( media ) => {
			const existingIds = new Set(
				validTracks
					.map( ( block ) => getTrackIdentifier( block.attributes ) )
					.filter( Boolean )
			);
			const newBlocks = (
				await createTrackBlocksFromMedia( media )
			).filter(
				( block ) =>
					! existingIds.has( getTrackIdentifier( block.attributes ) )
			);
			if ( newBlocks.length === 0 ) {
				return;
			}

			const nextBlocks = [ ...validTracks, ...newBlocks ];
			setCurrentTrackClientId( newBlocks[ 0 ].clientId );
			replaceInnerBlocks( clientId, nextBlocks );
			selectBlock( newBlocks[ 0 ].clientId );
		},
		[
			clientId,
			createTrackBlocksFromMedia,
			replaceInnerBlocks,
			selectBlock,
			setCurrentTrackClientId,
			validTracks,
		]
	);

	const playlistContext = useMemo(
		() => ( {
			currentTrackClientId,
			setCurrentTrackClientId,
		} ),
		[ currentTrackClientId, setCurrentTrackClientId ]
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
		renderAppender: false,
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
					accept={ AUDIO_AND_ZIP_ACCEPT }
					multiple="add"
					handleUpload={ false }
					allowedTypes={ ALLOWED_PLAYLIST_MEDIA_TYPES }
					onError={ onUploadError }
				/>
			</div>
		);
	}

	return (
		<>
			<BlockControls group="other" __experimentalShareWithChildBlocks>
				<MediaReplaceFlow
					name={ __( 'Add track' ) }
					onSelect={ onAddTracks }
					accept={ AUDIO_AND_ZIP_ACCEPT }
					multiple="add"
					handleUpload={ false }
					allowedTypes={ ALLOWED_PLAYLIST_MEDIA_TYPES }
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
				<MediaPlaceholder
					onSelect={ onAddTracks }
					accept={ AUDIO_AND_ZIP_ACCEPT }
					multiple="add"
					handleUpload={ false }
					disableMediaButtons
					allowedTypes={ ALLOWED_PLAYLIST_MEDIA_TYPES }
					onError={ onUploadError }
				/>
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
				<ol
					className={ clsx( 'wp-block-playlist__tracklist', {
						'wp-block-playlist__tracklist-is-hidden':
							! showTracklist,
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
