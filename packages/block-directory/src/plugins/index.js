/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import InserterMenuDownloadableBlocksPanel from './inserter-menu-downloadable-blocks-panel';
import AutoBlockUninstaller from '../components/auto-block-uninstaller';

registerPlugin( 'block-directory', {
	render() {
		return (
			<Fragment>
				<AutoBlockUninstaller />
				<InserterMenuDownloadableBlocksPanel />
			</Fragment>
		);
	},
} );
