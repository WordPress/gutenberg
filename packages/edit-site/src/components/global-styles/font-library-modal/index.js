/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal, TabPanel } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InstalledFonts from './installed-fonts';
import FontCollection from './font-collection';
import UploadFonts from './upload-fonts';
import { FontLibraryContext } from './context';

const DEFAULT_TABS = [
	{
		name: 'installed-fonts',
		title: __( 'Library' ),
		className: 'installed-fonts',
	},
	{
		name: 'upload-fonts',
		title: __( 'Upload' ),
		className: 'upload-fonts',
	},
];

const tabsFromCollections = ( collections ) =>
	collections.map( ( { id, name } ) => ( {
		name: id,
		title:
			collections.length === 1 && id === 'default-font-collection'
				? __( 'Install Fonts' )
				: name,
		className: 'collection',
	} ) );

function FontLibraryModal( {
	onRequestClose,
	initialTabName = 'installed-fonts',
} ) {
	const { collections } = useContext( FontLibraryContext );

	const tabs = [
		...DEFAULT_TABS,
		...tabsFromCollections( collections || [] ),
	];

	return (
		<Modal
			title={ __( 'Fonts' ) }
			onRequestClose={ onRequestClose }
			isFullScreen
			className="font-library-modal"
		>
			<TabPanel
				className="font-library-modal__tab-panel"
				initialTabName={ initialTabName }
				tabs={ tabs }
			>
				{ ( tab ) => {
					switch ( tab.name ) {
						case 'upload-fonts':
							return <UploadFonts />;
						case 'installed-fonts':
							return <InstalledFonts />;
						default:
							return <FontCollection id={ tab.name } />;
					}
				} }
			</TabPanel>
		</Modal>
	);
}

export default FontLibraryModal;
