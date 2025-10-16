/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useState } from '@wordpress/element';
import {
	MediaUpload,
	privateApis as mediaUtilsPrivateApis,
} from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { MediaUploadModal } = unlock( mediaUtilsPrivateApis );

/**
 * Wrapper component that adapts MediaUploadModal to work with the MediaUpload render prop API.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.render   Render prop function that receives { open } object.
 * @param {Function} props.onClose  Callback called when modal is closed.
 * @param {Function} props.onSelect Callback called when media is selected.
 * @return {JSX.Element} The adapter component.
 */
function MediaUploadModalAdapter( {
	render,
	onClose,
	onSelect,
	...otherProps
} ) {
	const [ isOpen, setIsOpen ] = useState( false );

	const handleOpen = () => setIsOpen( true );

	const handleClose = () => {
		setIsOpen( false );
		if ( onClose ) {
			onClose();
		}
	};

	const handleSelect = ( media ) => {
		setIsOpen( false );
		if ( onSelect ) {
			onSelect( media );
		}
	};

	return (
		<>
			{ render && render( { open: handleOpen } ) }
			<MediaUploadModal
				{ ...otherProps }
				isOpen={ isOpen }
				onClose={ handleClose }
				onSelect={ handleSelect }
			/>
		</>
	);
}

addFilter( 'editor.MediaUpload', 'core/editor/components/media-upload', () => {
	// Use MediaUploadModal if the dataviews media modal experiment is enabled
	if ( window.__experimentalDataViewsMediaModal ) {
		return MediaUploadModalAdapter;
	}
	// Otherwise, use the regular MediaUpload component
	return MediaUpload;
} );
