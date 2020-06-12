/**
 * WordPress dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import AutoBlockUninstaller from '../components/auto-block-uninstaller';
import InserterMenuDownloadableBlocksPanel from './inserter-menu-downloadable-blocks-panel';
import InstalledBlocksPrePublishPanel from './installed-blocks-pre-publish-panel';

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
