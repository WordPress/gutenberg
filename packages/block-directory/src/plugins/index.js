/**
 * WordPress dependencies
 */
import { registerPlugin } from '@wordpress/plugins';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import AutoBlockUninstaller from '../components/auto-block-uninstaller';
import InserterMenuDownloadableBlocksPanel from './inserter-menu-downloadable-blocks-panel';
import InstalledBlocksPrePublishPanel from './installed-blocks-pre-publish-panel';
import missingInstallView from './missing-install-view';

registerPlugin( 'block-directory', {
	render() {
		return (
			<>
				<AutoBlockUninstaller />
				<InserterMenuDownloadableBlocksPanel />
				<InstalledBlocksPrePublishPanel />
			</>
		);
	},
} );

addFilter(
	'blocks.registerBlockType',
	'block-directory/fallback',
	( settings, name ) => {
		if ( name !== 'core/missing' ) {
			return settings;
		}
		settings.edit = missingInstallView;

		return settings;
	}
);
