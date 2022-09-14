/**
 * WordPress dependencies
 */
import { Modal, Spinner } from '@wordpress/components';

const LoadingScreen = () => (
	<Modal
		isFullScreen
		isDismissible={ false }
		onRequestClose={ () => {} }
		__experimentalHideHeader
		className="block-editor-loading-screen-modal"
		overlayClassName="block-editor-loading-screen-modal-overlay"
	>
		<div className="block-editor-loading-screen-wrapper">
			<Spinner style={ { width: 64, height: 64 } } />
		</div>
	</Modal>
);

export default LoadingScreen;
