import { addFilter } from '@wordpress/hooks';
import deprecated from '@wordpress/deprecated';
import { useState } from '@wordpress/element';
import {
	MediaUpload,
	privateApis as mediaUtilsPrivateApis,
} from '@wordpress/media-utils';
import { unlock } from '../lock-unlock';

const { MediaUploadModal: MediaUploadModalComponent } = unlock(
	mediaUtilsPrivateApis
);

/**
 * Functional component wrapper for MediaUploadModal to maintain compatibility
 * with the stable MediaUpload component API (render prop pattern).
 * @param {Object} props Component props.
 */
function MediaUploadModalWrapper( props ) {
	const [ isOpen, setIsOpen ] = useState( false );

	const {
		allowedTypes,
		multiple,
		value,
		onSelect,
		title,
		modalClass,
		render,
		onClose,
	} = props;

	const closeModal = () => {
		setIsOpen( false );
		onClose?.();
	};

	const openModal = () => {
		setIsOpen( true );
	};

	return (
		<>
			{ render( { open: openModal } ) }
			<MediaUploadModalComponent
				allowedTypes={ allowedTypes }
				multiple={ multiple }
				value={ value }
				onSelect={ ( media ) => {
					onSelect( media );
					closeModal();
				} }
				onClose={ closeModal }
				title={ title }
				isOpen={ isOpen }
				modalClass={ modalClass }
			/>
		</>
	);
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
