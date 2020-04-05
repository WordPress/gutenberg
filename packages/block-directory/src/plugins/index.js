/**
 * WordPress dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import InserterMenuDownloadableBlocksPanel from './inserter-menu-downloadable-blocks-panel';

registerPlugin( 'block-directory', {
	render() {
		return <InserterMenuDownloadableBlocksPanel />;
	},
} );
