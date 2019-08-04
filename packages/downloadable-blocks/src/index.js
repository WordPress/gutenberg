/**
 * Internal dependencies
 */
import DiscoverBlocksPanel from './components/discover-blocks-panel';

function DownloadableBlocks( { onSelect, filterValue } ) {
	return (
		<div>
			{ filterValue }
			<DiscoverBlocksPanel
				onSelect={ onSelect }
				filterValue={ filterValue }
			/>
		</div>
	);
}

export default DownloadableBlocks;
