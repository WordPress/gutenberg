/**
 * External dependencies
 */
import clsx from 'clsx';
import { v4 as uuid } from 'uuid';

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
	ToggleControl,
	Disabled,
	SelectControl,
	Spinner,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __, _x, sprintf } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
import { safeHTML, __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Caption } from '../utils/caption';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const ALLOWED_MEDIA_TYPES = [ 'audio' ];

const CurrentTrack = ( { track, showImages, onTrackEnd } ) => {
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
				const titleA = a.attributes.title || '';
				const titleB = b.attributes.title || '';

				if ( trackOrder === 'asc' ) {
					return titleA.localeCompare( titleB );
				}
				return titleB.localeCompare( titleA );
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
							__nextHasNoMarginBottom
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
									__nextHasNoMarginBottom
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
									__nextHasNoMarginBottom
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
							__nextHasNoMarginBottom
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
							__nextHasNoMarginBottom
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
					<CurrentTrack
						track={ tracks[ trackListIndex ] }
						showImages={ showImages }
						onTrackEnd={ onTrackEnd }
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
					style={ { marginTop: 16 } }
				/>
			</figure>
		</>
	);
};

export default PlaylistEdit;
