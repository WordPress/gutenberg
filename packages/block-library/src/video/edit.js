/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import {
	BaseControl,
	Button,
	Disabled,
	PanelBody,
	Spinner,
	Placeholder,
	ToolbarButton,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	MediaReplaceFlow,
	RichText,
	useBlockProps,
	store as blockEditorStore,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';
import { useRef, useEffect, useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useInstanceId, usePrevious } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { video as icon, caption as captionIcon } from '@wordpress/icons';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';
import VideoCommonSettings from './edit-common-settings';
import TracksEditor from './tracks-editor';
import Tracks from './tracks';

// Much of this description is duplicated from MediaPlaceholder.
const placeholder = ( content ) => {
	return (
		<Placeholder
			className="block-editor-media-placeholder"
			withIllustration={ true }
			icon={ icon }
			label={ __( 'Video' ) }
			instructions={ __(
				'Upload a video file, pick one from your media library, or add one with a URL.'
			) }
		>
			{ content }
		</Placeholder>
	);
};

const ALLOWED_MEDIA_TYPES = [ 'video' ];
const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

function VideoEdit( {
	isSelected,
	attributes,
	className,
	setAttributes,
	insertBlocksAfter,
	onReplace,
} ) {
	const instanceId = useInstanceId( VideoEdit );
	const videoPlayer = useRef();
	const posterImageButton = useRef();
	const { id, caption, controls, poster, src, tracks } = attributes;
	const prevCaption = usePrevious( caption );
	const [ showCaption, setShowCaption ] = useState( !! caption );
	const isTemporaryVideo = ! id && isBlobURL( src );
	const mediaUpload = useSelect(
		( select ) => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);

	useEffect( () => {
		if ( ! id && isBlobURL( src ) ) {
			const file = getBlobByURL( src );
			if ( file ) {
				mediaUpload( {
					filesList: [ file ],
					onFileChange: ( [ media ] ) => onSelectVideo( media ),
					onError: onUploadError,
					allowedTypes: ALLOWED_MEDIA_TYPES,
				} );
			}
		}
	}, [] );

	useEffect( () => {
		// Placeholder may be rendered.
		if ( videoPlayer.current ) {
			videoPlayer.current.load();
		}
	}, [ poster ] );

	// We need to show the caption when changes come from
	// history navigation(undo/redo).
	useEffect( () => {
		if ( caption && ! prevCaption ) {
			setShowCaption( true );
		}
	}, [ caption, prevCaption ] );

	// Focus the caption when we click to add one.
	const captionRef = useCallback(
		( node ) => {
			if ( node && ! caption ) {
				node.focus();
			}
		},
		[ caption ]
	);

	useEffect( () => {
		if ( ! isSelected && ! caption ) {
			setShowCaption( false );
		}
	}, [ isSelected, caption ] );

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
			} );
			return;
		}

		// Sets the block's attribute and updates the edit component from the
		// selected media.
		setAttributes( {
			src: media.url,
			id: media.id,
			poster:
				media.image?.src !== media.icon ? media.image?.src : undefined,
			caption: media.caption,
		} );
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
			setAttributes( { src: newSrc, id: undefined, poster: undefined } );
		}
	}

	const { createErrorNotice } = useDispatch( noticesStore );
	function onUploadError( message ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	const classes = classnames( className, {
		'is-transient': isTemporaryVideo,
	} );

	const blockProps = useBlockProps( {
		className: classes,
	} );

	if ( ! src ) {
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

	function onSelectPoster( image ) {
		setAttributes( { poster: image.url } );
	}

	function onRemovePoster() {
		setAttributes( { poster: undefined } );

		// Move focus back to the Media Upload button.
		posterImageButton.current.focus();
	}

	const videoPosterDescription = `video-block__poster-image-description-${ instanceId }`;

	return (
		<>
			<BlockControls group="block">
				<ToolbarButton
					onClick={ () => {
						setShowCaption( ! showCaption );
						if ( showCaption && caption ) {
							setAttributes( { caption: undefined } );
						}
					} }
					icon={ captionIcon }
					isPressed={ showCaption }
					label={
						showCaption
							? __( 'Remove caption' )
							: __( 'Add caption' )
					}
				/>
			</BlockControls>
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
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<VideoCommonSettings
						setAttributes={ setAttributes }
						attributes={ attributes }
					/>
					<MediaUploadCheck>
						<BaseControl className="editor-video-poster-control">
							<BaseControl.VisualLabel>
								{ __( 'Poster image' ) }
							</BaseControl.VisualLabel>
							<MediaUpload
								title={ __( 'Select poster image' ) }
								onSelect={ onSelectPoster }
								allowedTypes={
									VIDEO_POSTER_ALLOWED_MEDIA_TYPES
								}
								render={ ( { open } ) => (
									<Button
										variant="primary"
										onClick={ open }
										ref={ posterImageButton }
										aria-describedby={
											videoPosterDescription
										}
									>
										{ ! poster
											? __( 'Select' )
											: __( 'Replace' ) }
									</Button>
								) }
							/>
							<p id={ videoPosterDescription } hidden>
								{ poster
									? sprintf(
											/* translators: %s: poster image URL. */
											__(
												'The current poster image url is %s'
											),
											poster
									  )
									: __(
											'There is no poster image currently selected'
									  ) }
							</p>
							{ !! poster && (
								<Button
									onClick={ onRemovePoster }
									variant="tertiary"
								>
									{ __( 'Remove' ) }
								</Button>
							) }
						</BaseControl>
					</MediaUploadCheck>
				</PanelBody>
			</InspectorControls>
			<figure { ...blockProps }>
				{ /*
					Disable the video tag if the block is not selected
					so the user clicking on it won't play the
					video when the controls are enabled.
				*/ }
				<Disabled isDisabled={ ! isSelected }>
					<video
						controls={ controls }
						poster={ poster }
						src={ src }
						ref={ videoPlayer }
					>
						<Tracks tracks={ tracks } />
					</video>
				</Disabled>
				{ isTemporaryVideo && <Spinner /> }
				{ showCaption &&
					( ! RichText.isEmpty( caption ) || isSelected ) && (
						<RichText
							identifier="caption"
							tagName="figcaption"
							className={ __experimentalGetElementClassName(
								'caption'
							) }
							aria-label={ __( 'Video caption text' ) }
							ref={ captionRef }
							placeholder={ __( 'Add caption' ) }
							value={ caption }
							onChange={ ( value ) =>
								setAttributes( { caption: value } )
							}
							inlineToolbar
							__unstableOnSplitAtEnd={ () =>
								insertBlocksAfter(
									createBlock( getDefaultBlockName() )
								)
							}
						/>
					) }
			</figure>
		</>
	);
}

export default VideoEdit;
