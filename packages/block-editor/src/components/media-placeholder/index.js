/**
 * External dependencies
 */
import {
	every,
	get,
	isArray,
	noop,
	startsWith,
} from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	FormFileUpload,
	Placeholder,
	DropZone,
	IconButton,
	withFilters,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import URLPopover from '../url-popover';

const InsertFromURLPopover = ( { src, onChange, onSubmit, onClose } ) => (
	<URLPopover onClose={ onClose }>
		<form
			className="editor-media-placeholder__url-input-form block-editor-media-placeholder__url-input-form"
			onSubmit={ onSubmit }
		>
			<input
				className="editor-media-placeholder__url-input-field block-editor-media-placeholder__url-input-field"
				type="url"
				aria-label={ __( 'URL' ) }
				placeholder={ __( 'Paste or type URL' ) }
				onChange={ onChange }
				value={ src }
			/>
			<IconButton
				className="editor-media-placeholder__url-input-submit-button block-editor-media-placeholder__url-input-submit-button"
				icon="editor-break"
				label={ __( 'Apply' ) }
				type="submit"
			/>
		</form>
	</URLPopover>
);

export class MediaPlaceholder extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			src: '',
			isURLInputVisible: false,
			mediaPreview: false,
		};
		this.onChangeSrc = this.onChangeSrc.bind( this );
		this.onSubmitSrc = this.onSubmitSrc.bind( this );
		this.onUpload = this.onUpload.bind( this );
		this.onFilesUpload = this.onFilesUpload.bind( this );
		this.openURLInput = this.openURLInput.bind( this );
		this.closeURLInput = this.closeURLInput.bind( this );
	}

	onlyAllowsImages() {
		const { allowedTypes } = this.props;
		if ( ! allowedTypes ) {
			return false;
		}
		return every( allowedTypes, ( allowedType ) => {
			return allowedType === 'image' || startsWith( allowedType, 'image/' );
		} );
	}

	componentDidMount() {
		this.setState( { src: get( this.props.value, [ 'src' ], '' ) } );
	}

	componentDidUpdate( prevProps ) {
		if ( get( prevProps.value, [ 'src' ], '' ) !== get( this.props.value, [ 'src' ], '' ) ) {
			this.setState( { src: get( this.props.value, [ 'src' ], '' ) } );
		}
	}

	onChangeSrc( event ) {
		this.setState( { src: event.target.value } );
	}

	onSubmitSrc( event ) {
		event.preventDefault();
		if ( this.state.src && this.props.onSelectURL ) {
			this.props.onSelectURL( this.state.src );
			this.closeURLInput();
		}
	}

	onUpload( event ) {
		this.onFilesUpload( event.target.files );
	}

	onFilesUpload( files ) {
		const {
			addToGallery,
			allowedTypes,
			mediaUpload,
			multiple,
			onError,
			onSelect,
			value = [],
		} = this.props;
		let setMedia;
		if ( multiple ) {
			if ( addToGallery ) {
				const currentValue = value;
				setMedia = ( newMedia ) => {
					onSelect( currentValue.concat( newMedia ) );
				};
			} else {
				setMedia = onSelect;
			}
		} else {
			setMedia = ( [ media ] ) => onSelect( media );
		}
		mediaUpload( {
			allowedTypes,
			filesList: files,
			onFileChange: setMedia,
			onError,
		} );
	}

	openURLInput() {
		this.setState( { isURLInputVisible: true } );
	}

	closeURLInput() {
		this.setState( { isURLInputVisible: false } );
	}

	renderPlaceholder( content, onClick ) {
		const {
			allowedTypes = [],
			className,
			icon,
			isAppender,
			labels = {},
			onDoubleClick,
			mediaPreview,
			notices,
			onSelectURL,
			mediaUpload,
		} = this.props;

		let instructions = labels.instructions;
		let title = labels.title;

		if ( ! mediaUpload && ! onSelectURL ) {
			instructions = __( 'To edit this block, you need permission to upload media.' );
		}

		if ( instructions === undefined || title === undefined ) {
			const isOneType = 1 === allowedTypes.length;
			const isAudio = isOneType && 'audio' === allowedTypes[ 0 ];
			const isImage = isOneType && 'image' === allowedTypes[ 0 ];
			const isVideo = isOneType && 'video' === allowedTypes[ 0 ];

			if ( instructions === undefined && mediaUpload ) {
				instructions = __( 'Drag a media file, upload a new one or select a file from your library.' );

				if ( isAudio ) {
					instructions = __( 'Drag an audio, upload a new one or select a file from your library.' );
				} else if ( isImage ) {
					instructions = __( 'Drag an image, upload a new one or select a file from your library.' );
				} else if ( isVideo ) {
					instructions = __( 'Drag a video, upload a new one or select a file from your library.' );
				}
			}

			if ( title === undefined ) {
				title = __( 'Media' );

				if ( isAudio ) {
					title = __( 'Audio' );
				} else if ( isImage ) {
					title = __( 'Image' );
				} else if ( isVideo ) {
					title = __( 'Video' );
				}
			}
		}

		const placeholderClassName = classnames(
			'block-editor-media-placeholder',
			'editor-media-placeholder',
			className,
			{ 'is-appender': isAppender }
		);

		return (
			<Placeholder
				icon={ icon }
				label={ title }
				instructions={ instructions }
				className={ placeholderClassName }
				notices={ notices }
				onClick={ onClick }
				onDoubleClick={ onDoubleClick }
				mediaPreview={ mediaPreview }
			>
				{ content }
			</Placeholder>
		);
	}

	renderDropZone() {
		const { onHTMLDrop = noop } = this.props;
		return (
			<DropZone
				onFilesDrop={ this.onFilesUpload }
				onHTMLDrop={ onHTMLDrop }
			/>
		);
	}

	renderCancelLink() {
		const {
			onCancel,
		} = this.props;
		return ( onCancel &&
			<Button
				className="block-editor-media-placeholder__cancel-button"
				title={ __( 'Cancel' ) }
				isLink
				onClick={ onCancel }
			>
				{ __( 'Cancel' ) }
			</Button>
		);
	}

	renderUrlSelectionUI() {
		const {
			onSelectURL,
		} = this.props;
		if ( ! onSelectURL ) {
			return null;
		}
		const {
			isURLInputVisible,
			src,
		} = this.state;
		return (
			<Fragment>
				<div className="editor-media-placeholder__url-input-container block-editor-media-placeholder__url-input-container">
					<Button
						className="editor-media-placeholder__button block-editor-media-placeholder__button"
						onClick={ this.openURLInput }
						isToggled={ isURLInputVisible }
						isLarge
					>
						{ __( 'Insert from URL' ) }
					</Button>
					{ isURLInputVisible && (
						<InsertFromURLPopover
							src={ src }
							onChange={ this.onChangeSrc }
							onSubmit={ this.onSubmitSrc }
							onClose={ this.closeURLInput }
						/>
					) }
				</div>
			</Fragment>
		);
	}

	renderMediaUploadChecked() {
		const {
			accept,
			addToGallery,
			allowedTypes = [],
			isAppender,
			mediaUpload,
			multiple = false,
			onSelect,
			value = {},
		} = this.props;

		const mediaLibraryButton = (
			<MediaUpload
				addToGallery={ addToGallery }
				gallery={ multiple && this.onlyAllowsImages() }
				multiple={ multiple }
				onSelect={ onSelect }
				allowedTypes={ allowedTypes }
				value={
					isArray( value ) ?
						value.map( ( { id } ) => id ) :
						value.id
				}
				render={ ( { open } ) => {
					return (
						<Button
							isLarge
							className={ classnames(
								'editor-media-placeholder__button',
								'editor-media-placeholder__media-library-button'
							) }
							onClick={ ( event ) => {
								event.stopPropagation();
								open();
							} }
						>
							{ __( 'Media Library' ) }
						</Button>
					);
				} }
			/>
		);

		if ( mediaUpload && isAppender ) {
			return (
				<Fragment>
					{ this.renderDropZone() }
					<FormFileUpload
						onChange={ this.onUpload }
						accept={ accept }
						multiple={ multiple }
						render={ ( { openFileDialog } ) => {
							const content = (
								<Fragment>
									<IconButton
										isLarge
										className={ classnames(
											'block-editor-media-placeholder__button',
											'editor-media-placeholder__button',
											'block-editor-media-placeholder__upload-button'
										) }
										icon="upload"
									>
										{ __( 'Upload' ) }
									</IconButton>
									{ mediaLibraryButton }
									{ this.renderUrlSelectionUI() }
									{ this.renderCancelLink() }
								</Fragment>
							);
							return this.renderPlaceholder( content, openFileDialog );
						} }
					/>
				</Fragment>
			);
		}
		if ( mediaUpload ) {
			const content = (
				<Fragment>
					{ this.renderDropZone() }
					<FormFileUpload
						isLarge
						className={ classnames(
							'block-editor-media-placeholder__button',
							'editor-media-placeholder__button',
							'block-editor-media-placeholder__upload-button'
						) }
						onChange={ this.onUpload }
						accept={ accept }
						multiple={ multiple }
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					{ mediaLibraryButton }
					{ this.renderUrlSelectionUI() }
					{ this.renderCancelLink() }
				</Fragment>
			);
			return this.renderPlaceholder( content );
		}
		return this.renderPlaceholder( mediaLibraryButton );
	}

	render() {
		const {
			dropZoneUIOnly,
		} = this.props;

		if ( dropZoneUIOnly ) {
			return (
				<MediaUploadCheck>
					{ this.renderDropZone() }
				</MediaUploadCheck>
			);
		}

		return (
			<MediaUploadCheck
				fallback={ this.renderPlaceholder( this.renderUrlSelectionUI() ) }
			>
				{ this.renderMediaUploadChecked() }
			</MediaUploadCheck>
		);
	}
}

const applyWithSelect = withSelect( ( select ) => {
	const { getSettings } = select( 'core/block-editor' );

	return {
		mediaUpload: getSettings().__experimentalMediaUpload,
	};
} );

export default compose(
	applyWithSelect,
	withFilters( 'editor.MediaPlaceholder' ),
)( MediaPlaceholder );
