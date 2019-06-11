/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import {
	BaseControl,
	Button,
	Disabled,
	IconButton,
	PanelBody,
	SelectControl,
	ToggleControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	RichText,
} from '@wordpress/block-editor';
import { Component, createRef } from '@wordpress/element';
import {
	__,
	sprintf,
} from '@wordpress/i18n';
import {
	compose,
	withInstanceId,
} from '@wordpress/compose';
import {
	withSelect,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';
import icon from './icon';

const ALLOWED_MEDIA_TYPES = [ 'video' ];
const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

class VideoEdit extends Component {
	constructor() {
		super( ...arguments );
		// edit component has its own src in the state so it can be edited
		// without setting the actual value outside of the edit UI
		this.state = {
			editing: ! this.props.attributes.src,
		};

		this.videoPlayer = createRef();
		this.posterImageButton = createRef();
		this.toggleAttribute = this.toggleAttribute.bind( this );
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
						this.setState( { editing: true } );
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

	toggleAttribute( attribute ) {
		return ( newValue ) => {
			this.props.setAttributes( { [ attribute ]: newValue } );
		};
	}

	onSelectURL( newSrc ) {
		const { attributes, setAttributes } = this.props;
		const { src } = attributes;

		// Set the block's src from the edit component's state, and switch off
		// the editing UI.
		if ( newSrc !== src ) {
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock(
				{ attributes: { url: newSrc } }
			);
			if ( undefined !== embedBlock ) {
				this.props.onReplace( embedBlock );
				return;
			}
			setAttributes( { src: newSrc, id: undefined } );
		}

		this.setState( { editing: false } );
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

	getAutoplayHelp( checked ) {
		return checked ? __( 'Note: Autoplaying videos may cause usability issues for some visitors.' ) : null;
	}

	render() {
		const {
			autoplay,
			caption,
			controls,
			loop,
			muted,
			playsInline,
			poster,
			preload,
			src,
		} = this.props.attributes;
		const {
			className,
			instanceId,
			isSelected,
			noticeUI,
			setAttributes,
		} = this.props;
		const { editing } = this.state;
		const switchToEditing = () => {
			this.setState( { editing: true } );
		};
		const onSelectVideo = ( media ) => {
			if ( ! media || ! media.url ) {
				// in this case there was an error and we should continue in the editing state
				// previous attributes should be removed because they may be temporary blob urls
				setAttributes( { src: undefined, id: undefined } );
				switchToEditing();
				return;
			}
			// sets the block's attribute and updates the edit component from the
			// selected media, then switches off the editing UI
			setAttributes( { src: media.url, id: media.id } );
			this.setState( { src: media.url, editing: false } );
		};

		if ( editing ) {
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

		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<>
				<BlockControls>
					<Toolbar>
						<IconButton
							className="components-icon-button components-toolbar__control"
							label={ __( 'Edit video' ) }
							onClick={ switchToEditing }
							icon="edit"
						/>
					</Toolbar>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Video Settings' ) }>
						<ToggleControl
							label={ __( 'Autoplay' ) }
							onChange={ this.toggleAttribute( 'autoplay' ) }
							checked={ autoplay }
							help={ this.getAutoplayHelp }
						/>
						<ToggleControl
							label={ __( 'Loop' ) }
							onChange={ this.toggleAttribute( 'loop' ) }
							checked={ loop }
						/>
						<ToggleControl
							label={ __( 'Muted' ) }
							onChange={ this.toggleAttribute( 'muted' ) }
							checked={ muted }
						/>
						<ToggleControl
							label={ __( 'Playback Controls' ) }
							onChange={ this.toggleAttribute( 'controls' ) }
							checked={ controls }
						/>
						<ToggleControl
							label={ __( 'Play inline' ) }
							onChange={ this.toggleAttribute( 'playsInline' ) }
							checked={ playsInline }
						/>
						<SelectControl
							label={ __( 'Preload' ) }
							value={ preload }
							onChange={ ( value ) => setAttributes( { preload: value } ) }
							options={ [
								{ value: 'auto', label: __( 'Auto' ) },
								{ value: 'metadata', label: __( 'Metadata' ) },
								{ value: 'none', label: __( 'None' ) },
							] }
						/>
						<MediaUploadCheck>
							<BaseControl
								className="editor-video-poster-control"
							>
								<BaseControl.VisualLabel>
									{ __( 'Poster Image' ) }
								</BaseControl.VisualLabel>
								<MediaUpload
									title={ __( 'Select Poster Image' ) }
									onSelect={ this.onSelectPoster }
									allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
									render={ ( { open } ) => (
										<Button
											isDefault
											onClick={ open }
											ref={ this.posterImageButton }
											aria-describedby={ videoPosterDescription }
										>
											{ ! this.props.attributes.poster ? __( 'Select Poster Image' ) : __( 'Replace image' ) }
										</Button>
									) }
								/>
								<p
									id={ videoPosterDescription }
									hidden
								>
									{ this.props.attributes.poster ?
										sprintf( __( 'The current poster image url is %s' ), this.props.attributes.poster ) :
										__( 'There is no poster image currently selected' )
									}
								</p>
								{ !! this.props.attributes.poster &&
									<Button onClick={ this.onRemovePoster } isLink isDestructive>
										{ __( 'Remove Poster Image' ) }
									</Button>
								}
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
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							inlineToolbar
						/>
					) }
				</figure>
			</>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		const { __experimentalMediaUpload } = getSettings();
		return {
			mediaUpload: __experimentalMediaUpload,
		};
	} ),
	withNotices,
	withInstanceId,
] )( VideoEdit );
