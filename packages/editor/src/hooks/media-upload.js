/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import deprecated from '@wordpress/deprecated';
import {
	MediaUpload,
	privateApis as mediaUtilsPrivateApis,
} from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { MediaUploadModal: MediaUploadModalComponent } = unlock(
	mediaUtilsPrivateApis
);

/**
 * Class component wrapper for MediaUploadModal to maintain compatibility
 * with the stable MediaUpload component API (render prop pattern).
 */
class MediaUploadModalWrapper extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			isOpen: false,
		};
		this.openModal = this.openModal.bind( this );
		this.closeModal = this.closeModal.bind( this );
	}

	openModal() {
		this.setState( { isOpen: true } );
	}

	closeModal() {
		this.setState( { isOpen: false } );
		this.props.onClose?.();
	}

	render() {
		const {
			allowedTypes,
			multiple,
			value,
			onSelect,
			title,
			modalClass,
			render,
		} = this.props;
		const { isOpen } = this.state;

		return (
			<>
				{ render( { open: this.openModal } ) }
				<MediaUploadModalComponent
					allowedTypes={ allowedTypes }
					multiple={ multiple }
					value={ value }
					onSelect={ ( media ) => {
						onSelect( media );
						this.closeModal();
					} }
					onClose={ this.closeModal }
					title={ title }
					isOpen={ isOpen }
					modalClass={ modalClass }
				/>
			</>
		);
	}
}

if ( window.__experimentalDataViewsMediaModal ) {
	// Use the wrapper component for editor.MediaUpload when the experimental flag is enabled
	addFilter(
		'editor.MediaUpload',
		'core/editor/components/media-upload',
		() => {
			deprecated( 'Extending MediaUpload as a class component', {
				since: '7.0',
				version: '7.2',
				hint: 'MediaUpload will become a function component in WordPress 7.2 Please update any custom implementations to use function components instead.',
			} );
			return MediaUploadModalWrapper;
		}
	);
} else {
	addFilter(
		'editor.MediaUpload',
		'core/editor/components/media-upload',
		() => {
			return MediaUpload;
		}
	);
}
