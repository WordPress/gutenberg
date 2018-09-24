/**
 * External dependencies
 */
import { every, get, noop, startsWith } from 'lodash';
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
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import MediaUpload from '../media-upload';
import { mediaUpload } from '../../utils/';

class MediaPlaceholder extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			src: '',
			isURLInputExpanded: false,
		};
		this.onChangeSrc = this.onChangeSrc.bind( this );
		this.onSubmitSrc = this.onSubmitSrc.bind( this );
		this.onUpload = this.onUpload.bind( this );
		this.onFilesUpload = this.onFilesUpload.bind( this );
		this.toggleURLInputVisibility = this.toggleURLInputVisibility.bind( this );
	}

	getAllowedTypes() {
		const { allowedTypes, type: deprecatedType } = this.props;
		let allowedTypesToUse = allowedTypes;
		if ( ! allowedTypes && deprecatedType ) {
			deprecated( 'type property of wp.editor.MediaPlaceholder', {
				version: '4.2',
				alternative: 'allowedTypes property containing an array with the allowedTypes or do not pass any property if all types are allowed',
			} );
			if ( deprecatedType === '*' ) {
				allowedTypesToUse = undefined;
			} else {
				allowedTypesToUse = [ deprecatedType ];
			}
		}
		return allowedTypesToUse;
	}

	onlyAllowsImages() {
		const allowedTypes = this.getAllowedTypes();
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
		const value = event.target.value;

		const stateUpdate = {
			src: value,
			isURLInputExpanded: value.length > 0,
		};

		this.setState( stateUpdate );
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
		const { onSelect, multiple, onError } = this.props;
		const allowedTypes = this.getAllowedTypes();
		const setMedia = multiple ? onSelect : ( [ media ] ) => onSelect( media );
		mediaUpload( {
			allowedTypes,
			filesList: files,
			onFileChange: setMedia,
			onError,
		} );
	}

	toggleURLInputVisibility() {
		this.setState( { isURLInputExpanded: true } );
	}

	render() {
		const {
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
		} = this.props;

		const {
			isURLInputExpanded,
		} = this.state;

		const urlInputFormClasses = classnames( 'editor-media-placeholder__url-input-form', {
			'is-expanded': isURLInputExpanded,
		} );

		const allowedTypes = this.getAllowedTypes();

		return (
			<Placeholder
				icon={ icon }
				label={ labels.title }
				// translators: %s: media name label e.g: "an audio","an image", "a video"
				instructions={ sprintf( __( 'Drag %s, upload a new one or select a file from your library.' ), labels.name ) }
				className={ classnames( 'editor-media-placeholder', className ) }
				notices={ notices }
			>
				<DropZone
					onFilesDrop={ this.onFilesUpload }
					onHTMLDrop={ onHTMLDrop }
				/>
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
					gallery={ multiple && this.onlyAllowsImages() }
					multiple={ multiple }
					onSelect={ onSelect }
					allowedTypes={ allowedTypes }
					value={ value.id }
					render={ ( { open } ) => (
						<Button isLarge onClick={ open }>
							{ __( 'Media Library' ) }
						</Button>
					) }
				/>
				{ onSelectURL && (
					<form
						className={ urlInputFormClasses }
						onSubmit={ this.onSubmitSrc }
					>
						<input
							type="url"
							className="components-placeholder__input editor-media-placeholder__url-input"
							aria-label={ labels.title }
							placeholder={ __( 'Enter URL here…' ) }
							onChange={ this.onChangeSrc }
							value={ this.state.src }
						/>
						<Button
							className="editor-media-placeholder__url-input-submit-button"
							isLarge
							type="submit">
							{ __( 'Use URL' ) }
						</Button>
					</form>
				) }
			</Placeholder>
		);
	}
}

export default MediaPlaceholder;
