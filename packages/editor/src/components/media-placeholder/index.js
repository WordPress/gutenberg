/**
 * External dependencies
 */
import { every, get, noop, startsWith, defaultTo } from 'lodash';
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
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import URLPopover from '../url-popover';
import { mediaUpload } from '../../utils/';

const InsertFromURLPopover = ( { src, onChange, onSubmit, onClose } ) => (
	<URLPopover onClose={ onClose }>
		<form
			className="editor-media-placeholder__url-input-form"
			onSubmit={ onSubmit }
		>
			<input
				className="editor-media-placeholder__url-input-field"
				type="url"
				aria-label={ __( 'URL' ) }
				placeholder={ __( 'Paste or type URL' ) }
				onChange={ onChange }
				value={ src }
			/>
			<IconButton
				className="editor-media-placeholder__url-input-submit-button"
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
		const { onSelect, multiple, onError, allowedTypes } = this.props;
		const setMedia = multiple ? onSelect : ( [ media ] ) => onSelect( media );
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

	render() {
		const {
			accept,
			icon,
			className,
			labels = {},
			onSelect,
			value = {},
			onSelectURL,
			onHTMLDrop = noop,
			multiple = false,
			notices,
			allowedTypes = [],
			hasUploadPermissions,
		} = this.props;

		const {
			isURLInputVisible,
			src,
		} = this.state;

		let instructions = labels.instructions || '';
		let title = labels.title || '';

		if ( ! hasUploadPermissions && ! onSelectURL ) {
			instructions = __( 'To edit this block, you need permission to upload media.' );
		}

		if ( ! instructions || ! title ) {
			const isOneType = 1 === allowedTypes.length;
			const isAudio = isOneType && 'audio' === allowedTypes[ 0 ];
			const isImage = isOneType && 'image' === allowedTypes[ 0 ];
			const isVideo = isOneType && 'video' === allowedTypes[ 0 ];

			if ( ! instructions ) {
				if ( hasUploadPermissions ) {
					instructions = __( 'Drag a media file, upload a new one or select a file from your library.' );

					if ( isAudio ) {
						instructions = __( 'Drag an audio, upload a new one or select a file from your library.' );
					} else if ( isImage ) {
						instructions = __( 'Drag an image, upload a new one or select a file from your library.' );
					} else if ( isVideo ) {
						instructions = __( 'Drag a video, upload a new one or select a file from your library.' );
					}
				} else if ( ! hasUploadPermissions && onSelectURL ) {
					instructions = __( 'Given your current role, you can only link a media file, you cannot upload.' );

					if ( isAudio ) {
						instructions = __( 'Given your current role, you can only link an audio, you cannot upload.' );
					} else if ( isImage ) {
						instructions = __( 'Given your current role, you can only link an image, you cannot upload.' );
					} else if ( isVideo ) {
						instructions = __( 'Given your current role, you can only link a video, you cannot upload.' );
					}
				}
			}

			if ( ! title ) {
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

		return (
			<Placeholder
				icon={ icon }
				label={ title }
				instructions={ instructions }
				className={ classnames( 'editor-media-placeholder', className ) }
				notices={ notices }
			>
				<MediaUploadCheck>
					<DropZone
						onFilesDrop={ this.onFilesUpload }
						onHTMLDrop={ onHTMLDrop }
					/>
					<FormFileUpload
						isLarge
						className="editor-media-placeholder__button"
						onChange={ this.onUpload }
						accept={ accept }
						multiple={ multiple }
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUpload
						gallery={ multiple && this.onlyAllowsImages() }
						multiple={ multiple }
						onSelect={ onSelect }
						allowedTypes={ allowedTypes }
						value={ value.id }
						render={ ( { open } ) => (
							<Button
								isLarge
								className="editor-media-placeholder__button"
								onClick={ open }
							>
								{ __( 'Media Library' ) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
				{ onSelectURL && (
					<div className="editor-media-placeholder__url-input-container">
						<Button
							className="editor-media-placeholder__button"
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
				) }
			</Placeholder>
		);
	}
}

const applyWithSelect = withSelect( ( select ) => {
	const { canUser } = select( 'core' );

	return {
		hasUploadPermissions: defaultTo( canUser( 'create', 'media' ), true ),
	};
} );

export default compose(
	applyWithSelect,
	withFilters( 'editor.MediaPlaceholder' ),
)( MediaPlaceholder );
