/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import {
	BaseControl,
	Button,
	Disabled,
	PanelBody,
	withNotices,
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
} from '@wordpress/block-editor';
import { Component, createRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { compose, withInstanceId } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { video as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';
import VideoCommonSettings from './edit-common-settings';

const ALLOWED_MEDIA_TYPES = [ 'video' ];
const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

class VideoEdit extends Component {
	constructor() {
		super( ...arguments );
		this.videoPlayer = createRef();
		this.posterImageButton = createRef();
		this.onSelectURL = this.onSelectURL.bind( this );
		this.onSelectPoster = this.onSelectPoster.bind( this );
		this.onRemovePoster = this.onRemovePoster.bind( this );
		this.onUploadError = this.onUploadError.bind( this );
	}

	componentDidMount() {
		const {
			attributes,
			mediaUpload,
			noticeOperations,
			setAttributes,
		} = this.props;
		const { id, src = '' } = attributes;
		if ( ! id && isBlobURL( src ) ) {
			const file = getBlobByURL( src );
			if ( file ) {
				mediaUpload( {
					filesList: [ file ],
					onFileChange: ( [ { url } ] ) => {
						setAttributes( { src: url } );
					},
					onError: ( message ) => {
						noticeOperations.createErrorNotice( message );
					},
					allowedTypes: ALLOWED_MEDIA_TYPES,
				} );
			}
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.attributes.poster !== prevProps.attributes.poster ) {
			this.videoPlayer.current.load();
		}
	}

	onSelectURL( newSrc ) {
		const { attributes, setAttributes } = this.props;
		const { src } = attributes;

		if ( newSrc !== src ) {
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock( {
				attributes: { url: newSrc },
			} );
			if ( undefined !== embedBlock ) {
				this.props.onReplace( embedBlock );
				return;
			}
			setAttributes( { src: newSrc, id: undefined } );
		}
	}

	onSelectPoster( image ) {
		const { setAttributes } = this.props;
		setAttributes( { poster: image.url } );
	}

	onRemovePoster() {
		const { setAttributes } = this.props;
		setAttributes( { poster: '' } );

		// Move focus back to the Media Upload button.
		this.posterImageButton.current.focus();
	}

	onUploadError( message ) {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	render() {
		const { id, caption, controls, poster, src } = this.props.attributes;
		const {
			className,
			instanceId,
			isSelected,
			noticeUI,
			attributes,
			setAttributes,
		} = this.props;
		const onSelectVideo = ( media ) => {
			if ( ! media || ! media.url ) {
				// in this case there was an error
				// previous attributes should be removed
				// because they may be temporary blob urls
				setAttributes( { src: undefined, id: undefined } );
				return;
			}
			// sets the block's attribute and updates the edit component from the
			// selected media
			setAttributes( { src: media.url, id: media.id } );
		};

		if ( ! src ) {
			return (
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					className={ className }
					onSelect={ onSelectVideo }
					onSelectURL={ this.onSelectURL }
					accept="video/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					value={ this.props.attributes }
					notices={ noticeUI }
					onError={ this.onUploadError }
				/>
			);
		}
		const videoPosterDescription = `video-block__poster-image-description-${ instanceId }`;

		return (
			<>
				<BlockControls>
					<MediaReplaceFlow
						mediaId={ id }
						mediaURL={ src }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						accept="video/*"
						onSelect={ onSelectVideo }
						onSelectURL={ this.onSelectURL }
						onError={ this.onUploadError }
					/>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Video settings' ) }>
						<VideoCommonSettings
							setAttributes={ setAttributes }
							attributes={ attributes }
						/>
						<MediaUploadCheck>
							<BaseControl className="editor-video-poster-control">
								<BaseControl.VisualLabel>
									{ __( 'Poster Image' ) }
								</BaseControl.VisualLabel>
								<MediaUpload
									title={ __( 'Select Poster Image' ) }
									onSelect={ this.onSelectPoster }
									allowedTypes={
										VIDEO_POSTER_ALLOWED_MEDIA_TYPES
									}
									render={ ( { open } ) => (
										<Button
											isSecondary
											onClick={ open }
											ref={ this.posterImageButton }
											aria-describedby={
												videoPosterDescription
											}
										>
											{ ! this.props.attributes.poster
												? __( 'Select Poster Image' )
												: __( 'Replace image' ) }
										</Button>
									) }
								/>
								<p id={ videoPosterDescription } hidden>
									{ this.props.attributes.poster
										? sprintf(
												__(
													'The current poster image url is %s'
												),
												this.props.attributes.poster
										  )
										: __(
												'There is no poster image currently selected'
										  ) }
								</p>
								{ !! this.props.attributes.poster && (
									<Button
										onClick={ this.onRemovePoster }
										isLink
										isDestructive
									>
										{ __( 'Remove Poster Image' ) }
									</Button>
								) }
							</BaseControl>
						</MediaUploadCheck>
					</PanelBody>
				</InspectorControls>
				<figure className={ className }>
					{ /*
						Disable the video tag so the user clicking on it won't play the
						video when the controls are enabled.
					*/ }
					<Disabled>
						<video
							controls={ controls }
							poster={ poster }
							src={ src }
							ref={ this.videoPlayer }
						/>
					</Disabled>
					{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							onChange={ ( value ) =>
								setAttributes( { caption: value } )
							}
							inlineToolbar
						/>
					) }
				</figure>
			</>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		const { mediaUpload } = getSettings();
		return { mediaUpload };
	} ),
	withNotices,
	withInstanceId,
] )( VideoEdit );
