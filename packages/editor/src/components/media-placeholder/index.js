/**
 * External dependencies
 */
import { get, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Button,
	FormFileUpload,
	Placeholder,
	DropZone,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import { mediaUpload } from '../../utils/';

export class MediaPlaceholder extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			src: '',
		};
		this.onChangeSrc = this.onChangeSrc.bind( this );
		this.onSubmitSrc = this.onSubmitSrc.bind( this );
		this.onUpload = this.onUpload.bind( this );
		this.onFilesUpload = this.onFilesUpload.bind( this );
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
		this.setState( {
			src: event.target.value,
		} );
	}

	onSubmitSrc( event ) {
		event.preventDefault();
		if ( this.state.src && this.props.onSelectURL ) {
			this.props.onSelectURL( this.state.src );
		}
	}

	onUpload( event ) {
		this.onFilesUpload( event.target.files );
	}

	onFilesUpload( files ) {
		const { onSelect, type, multiple, onError } = this.props;
		const setMedia = multiple ? onSelect : ( [ media ] ) => onSelect( media );
		mediaUpload( {
			allowedType: type,
			filesList: files,
			onFileChange: setMedia,
			onError,
		} );
	}

	render() {
		const {
			type,
			accept,
			icon,
			className,
			labels,
			onSelect,
			value = {},
			onSelectURL,
			onHTMLDrop = noop,
			multiple = false,
			notices,
			hasUploadPermissions,
		} = this.props;

		let instructions;
		if ( hasUploadPermissions ) {
			instructions = sprintf( __( 'Drag %s, upload a new one, or select a file from your library.' ), labels.name );
		} else if ( onSelectURL ) {
			instructions = sprintf( __( 'Given your current role, you can only link %s, you cannot upload.' ), labels.name );
		} else {
			instructions = __( 'To edit this block, you need permission to upload media.' );
		}

		return (
			<Placeholder
				icon={ icon }
				label={ labels.title }
				// translators: %s: media name label e.g: "an audio","an image", "a video"
				instructions={ instructions }
				className={ classnames( 'editor-media-placeholder', className ) }
				notices={ notices }
			>
				<MediaUploadCheck>
					<DropZone
						onFilesDrop={ this.onFilesUpload }
						onHTMLDrop={ onHTMLDrop }
					/>
				</MediaUploadCheck>
				{ onSelectURL && (
					<form onSubmit={ this.onSubmitSrc }>
						<input
							type="url"
							className="components-placeholder__input"
							aria-label={ labels.title }
							placeholder={ __( 'Enter URL here…' ) }
							onChange={ this.onChangeSrc }
							value={ this.state.src }
						/>
						<Button
							isLarge
							type="submit">
							{ __( 'Use URL' ) }
						</Button>
					</form>
				) }
				<MediaUploadCheck>
					<FormFileUpload
						isLarge
						className="editor-media-placeholder__upload-button"
						onChange={ this.onUpload }
						accept={ accept }
						multiple={ multiple }
					>
						{ __( 'Upload' ) }
					</FormFileUpload>
					<MediaUpload
						gallery={ multiple }
						multiple={ multiple }
						onSelect={ onSelect }
						type={ type }
						value={ value.id }
						render={ ( { open } ) => (
							<Button isLarge onClick={ open }>
								{ __( 'Media Library' ) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
			</Placeholder>
		);
	}
}

export default withSelect( ( select ) => {
	const {
		hasUploadPermissions,
	} = select( 'core' );

	return {
		hasUploadPermissions: hasUploadPermissions(),
	};
} )( MediaPlaceholder );
