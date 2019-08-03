/**
 * WordPress dependencies
 */
import { __experimentalInserterMenuExtension } from '@wordpress/block-editor';
import DownloadableBlocks from '@wordpress/downloadable-blocks';

function InserterMenuDownloadableBlocksPanel() {
	return (
		<__experimentalInserterMenuExtension>
			{
				( { onSelect, onHover, filterValue, isMenuEmpty } ) => (
					isMenuEmpty && (
						<DownloadableBlocks
							onSelect={ onSelect }
							onHover={ onHover }
							filterValue={ filterValue }
						/>
					)
				)
			}
		</__experimentalInserterMenuExtension>
	);
}

export default InserterMenuDownloadableBlocksPanel;
