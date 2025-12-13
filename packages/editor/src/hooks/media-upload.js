/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
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
/** @param {any} props */
function MediaUploadModalWrapper( props ) {
	const [ state, setState ] = useState( { isOpen: false } );

	function openModal() {
		setState( ( prev ) => ( { ...prev, isOpen: true } ) );
	}

	function closeModal() {
		setState( ( prev ) => ( { ...prev, isOpen: false } ) );
		props.onClose?.();
	}

	function render() {
		const {
			allowedTypes,
			multiple,
			value,
			onSelect,
			title,
			modalClass,
			render: renderProp,
		} = props;
		const { isOpen } = state;

		return (
			<>
				{ renderProp( { open: openModal } ) }
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
	return render();
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
