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
import filterMissing from './filter-missing';

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
	'editor.missingEdit',
	'block-directory/install-missing',
	filterMissing
);
