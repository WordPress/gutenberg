/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal, TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InstalledFonts from './installed-fonts';
import LocalFonts from './local-fonts';
import { MODAL_TABS } from './constants';

function FontLibraryModal( {
	onRequestClose,
	initialTabName = 'installed-fonts',
} ) {
	return (
		<Modal
			title={ __( 'Fonts' ) }
			onRequestClose={ onRequestClose }
			isFullScreen={ true }
			className="font-library-modal"
			style={ { width: '65vw' } }
		>
			<TabPanel
				className="font-library-modal__tab-panel"
				initialTabName={ initialTabName }
				tabs={ MODAL_TABS }
			>
				{ ( tab ) => {
					switch ( tab.name ) {
						case 'local-fonts':
							return <LocalFonts />;
						case 'installed-fonts':
						default:
							return <InstalledFonts />;
					}
				} }
			</TabPanel>
		</Modal>
	);
}

export default FontLibraryModal;
