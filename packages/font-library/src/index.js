/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Modal,
} from '@wordpress/components';
import FontLibrary from './font-library';

function FontLibraryModal( {
	onRequestClose,
} ) {

	return (
		<Modal
			title={ __( 'Fonts' ) }
			onRequestClose={ onRequestClose }
			isFullScreen
			className="font-library-modal"
		>
			<div className="font-library-modal__tabs">
				<FontLibrary></FontLibrary>
			</div>
		</Modal>
	);
}

export default FontLibraryModal;
