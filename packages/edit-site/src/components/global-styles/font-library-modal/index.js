/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Modal,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InstalledFonts from './installed-fonts';
import FontCollection from './font-collection';
import UploadFonts from './upload-fonts';
import { FontLibraryContext } from './context';
import { unlock } from '../../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

const DEFAULT_TABS = [
	{
		name: 'installed-fonts',
		title: __( 'Library' ),
	},
	{
		name: 'upload-fonts',
		title: __( 'Upload' ),
	},
];

const tabsFromCollections = ( collections ) =>
	collections.map( ( { id, name } ) => ( {
		name: id,
		title:
			collections.length === 1 && id === 'default-font-collection'
				? __( 'Install Fonts' )
				: name,
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
			<div className="font-library-modal__tab-panel">
				<Tabs initialTabId={ initialTabName }>
					<Tabs.TabList>
						{ tabs.map( ( { name, title } ) => (
							<Tabs.Tab key={ name } tabId={ name }>
								{ title }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
					{ tabs.map( ( { name } ) => {
						let contents;
						switch ( name ) {
							case 'upload-fonts':
								contents = <UploadFonts />;
								break;
							case 'installed-fonts':
								contents = <InstalledFonts />;
								break;
							default:
								contents = <FontCollection id={ name } />;
						}
						return (
							<Tabs.TabPanel
								key={ name }
								tabId={ name }
								focusable="false"
							>
								{ contents }
							</Tabs.TabPanel>
						);
					} ) }
				</Tabs>
			</div>
		</Modal>
	);
}

export default FontLibraryModal;
