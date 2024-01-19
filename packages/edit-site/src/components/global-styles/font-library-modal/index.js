/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Modal,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InstalledFonts from './installed-fonts';
import FontCollection from './font-collection';
import UploadFonts from './upload-fonts';
import { FontLibraryContext } from './context';
import { unlock } from '../../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

function FontLibraryModal( {
	onRequestClose,
	initialTabId = 'installed-fonts',
} ) {
	const { collections } = useContext( FontLibraryContext );

	const fontLibraryAssetInstall = useSelect(
		( select ) =>
			select( editorStore ).getEditorSettings().fontLibraryAssetInstall,
		[]
	);

	const tabs = [
		{
			id: 'installed-fonts',
			title: __( 'Library' ),
		},
	];

	if ( fontLibraryAssetInstall !== 'denied' ) {
		tabs.push( {
			id: 'upload-fonts',
			title: __( 'Upload' ),
		} );
	}

	collections
		.filter( ( fontCollection ) => {
			// Don't show collections that require installation when the system doesn't allowe it
			if (
				fontCollection.require_download === true &&
				fontLibraryAssetInstall === 'denied'
			) {
				return false;
			}
			return true;
		} )
		.forEach( ( { id, name } ) => {
			tabs.push( {
				id,
				title: name,
			} );
		} );

	return (
		<Modal
			title={ __( 'Fonts' ) }
			onRequestClose={ onRequestClose }
			isFullScreen
			className="font-library-modal"
		>
			<div className="font-library-modal__tabs">
				<Tabs initialTabId={ initialTabId }>
					<Tabs.TabList>
						{ tabs.map( ( { id, title } ) => (
							<Tabs.Tab key={ id } tabId={ id }>
								{ title }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
					{ tabs.map( ( { id } ) => {
						let contents;
						switch ( id ) {
							case 'upload-fonts':
								contents = <UploadFonts />;
								break;
							case 'installed-fonts':
								contents = <InstalledFonts />;
								break;
							default:
								contents = <FontCollection id={ id } />;
						}
						return (
							<Tabs.TabPanel
								key={ id }
								tabId={ id }
								focusable={ false }
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
