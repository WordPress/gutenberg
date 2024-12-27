/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import {
	Disabled,
	Spinner,
	Placeholder,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
} from '@wordpress/block-editor';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { video as icon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import PosterImage from './poster-image';
import { createUpgradedEmbedBlock } from '../embed/util';
import {
	useUploadMediaFromBlobURL,
	useToolsPanelDropdownMenuProps,
} from '../utils/hooks';
import VideoCommonSettings from './edit-common-settings';
import TracksEditor from './tracks-editor';
import Tracks from './tracks';
import { Caption } from '../utils/caption';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

function VideoEdit( {
	isSelected: isSingleSelected,
	attributes,
	className,
	setAttributes,
	insertBlocksAfter,
	onReplace,
} ) {
	const instanceId = useInstanceId( VideoEdit );
	const videoPlayer = useRef();
	const { id, controls, poster, src, tracks } = attributes;
	const [ temporaryURL, setTemporaryURL ] = useState( attributes.blob );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	useUploadMediaFromBlobURL( {
		url: temporaryURL,
		allowedTypes: ALLOWED_MEDIA_TYPES,
		onChange: onSelectVideo,
		onError: onUploadError,
	} );

	useEffect( () => {
		// Placeholder may be rendered.
		if ( videoPlayer.current ) {
			videoPlayer.current.load();
		}
	}, [ poster ] );

	function onSelectVideo( media ) {
		if ( ! media || ! media.url ) {
			// In this case there was an error
			// previous attributes should be removed
			// because they may be temporary blob urls.
			setAttributes( {
				src: undefined,
				id: undefined,
				poster: undefined,
				caption: undefined,
				blob: undefined,
			} );
			setTemporaryURL();
			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		// Sets the block's attribute and updates the edit component from the
		// selected media.
		setAttributes( {
			blob: undefined,
			src: media.url,
			id: media.id,
			poster:
				media.image?.src !== media.icon ? media.image?.src : undefined,
			caption: media.caption,
		} );
		setTemporaryURL();
	}

	function onSelectURL( newSrc ) {
		if ( newSrc !== src ) {
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock( {
				attributes: { url: newSrc },
			} );
			if ( undefined !== embedBlock && onReplace ) {
				onReplace( embedBlock );
				return;
			}
			setAttributes( {
				blob: undefined,
				src: newSrc,
				id: undefined,
				poster: undefined,
			} );
			setTemporaryURL();
		}
	}

	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	// Much of this description is duplicated from MediaPlaceholder.
	const placeholder = ( content ) => {
		return (
			<Placeholder
				className="block-editor-media-placeholder"
				withIllustration={ ! isSingleSelected }
				icon={ icon }
				label={ __( 'Video' ) }
				instructions={ __(
					'Drag and drop a video, upload, or choose from your library.'
				) }
			>
				{ content }
			</Placeholder>
		);
	};

	const classes = clsx( className, {
		'is-transient': !! temporaryURL,
	} );

	const blockProps = useBlockProps( {
		className: classes,
	} );

	if ( ! src && ! temporaryURL ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					onSelect={ onSelectVideo }
					onSelectURL={ onSelectURL }
					accept="video/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ attributes }
					onError={ onUploadError }
					placeholder={ placeholder }
				/>
			</div>
		);
	}

	return (
		<>
			{ isSingleSelected && (
				<>
					<BlockControls>
						<TracksEditor
							tracks={ tracks }
							onChange={ ( newTracks ) => {
								setAttributes( { tracks: newTracks } );
							} }
						/>
					</BlockControls>
					<BlockControls group="other">
						<MediaReplaceFlow
							mediaId={ id }
							mediaURL={ src }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							accept="video/*"
							onSelect={ onSelectVideo }
							onSelectURL={ onSelectURL }
							onError={ onUploadError }
							onReset={ () => onSelectVideo( undefined ) }
						/>
					</BlockControls>
				</>
			) }
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							autoplay: false,
							controls: true,
							loop: false,
							muted: false,
							playsInline: false,
							preload: 'metadata',
							poster: '',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<VideoCommonSettings
						setAttributes={ setAttributes }
						attributes={ attributes }
					/>
					<PosterImage
						poster={ poster }
						setAttributes={ setAttributes }
						instanceId={ instanceId }
					/>
				</ToolsPanel>
			</InspectorControls>
			<figure { ...blockProps }>
				{ /*
                Disable the video tag if the block is not selected
                so the user clicking on it won't play the
                video when the controls are enabled.
            */ }
				<Disabled isDisabled={ ! isSingleSelected }>
					<video
						controls={ controls }
						poster={ poster }
						src={ src || temporaryURL }
						ref={ videoPlayer }
					>
						<Tracks tracks={ tracks } />
					</video>
				</Disabled>
				{ !! temporaryURL && <Spinner /> }
				<Caption
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSingleSelected }
					insertBlocksAfter={ insertBlocksAfter }
					label={ __( 'Video caption text' ) }
					showToolbarButton={ isSingleSelected }
				/>
			</figure>
		</>
	);
}

export default VideoEdit;
