/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Modal,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useState, useContext } from '@wordpress/element';

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
	const [ selectedTab, setSelectedTab ] = useState( initialTabName );

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
			<Tabs selectedTabId={ selectedTab } onSelect={ setSelectedTab }>
				<Tabs.TabList className="font-library-modal__tab-list">
					{ tabs.map( ( tab ) => (
						<Tabs.Tab
							key={ tab.name }
							tabId={ tab.name }
							className={ tab.className }
						>
							{ tab.title }
						</Tabs.Tab>
					) ) }
				</Tabs.TabList>
				<Tabs.TabPanel tabId={ 'installed-fonts' }>
					<InstalledFonts />
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ 'upload-fonts' }>
					<UploadFonts />
				</Tabs.TabPanel>
				{ tabsFromCollections( collections || [] ).map( ( tab ) => (
					<Tabs.TabPanel key={ tab.name } tabId={ tab.name }>
						<FontCollection id={ tab.name } />
					</Tabs.TabPanel>
				) ) }
			</Tabs>
		</Modal>
	);
}

export default FontLibraryModal;
