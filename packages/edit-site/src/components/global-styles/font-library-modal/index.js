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
import { FontLibraryContext } from './context';

const INSTALLED_FONTS_TAB = {
	name: 'installed-fonts',
	title: __( 'Library' ),
	className: 'installed-fonts',
};

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
		INSTALLED_FONTS_TAB,
		...tabsFromCollections( collections || [] ),
	];

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
				tabs={ tabs }
			>
				{ ( tab ) => {
					switch ( tab.name ) {
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
