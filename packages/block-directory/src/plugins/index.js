/**
 * WordPress dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import InserterMenuDownloadableBlocksPanel from './inserter-menu-downloadable-blocks-panel';
import DownloadableBlockPrePublishPanel from './downloadable-block-pre-publish-panel';

registerPlugin( 'block-directory', {
	render() {
		return (
			<>
				<InserterMenuDownloadableBlocksPanel />
				<DownloadableBlockPrePublishPanel />
			</>
		);
	},
} );
