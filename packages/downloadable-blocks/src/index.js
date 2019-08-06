/**
 * Internal dependencies
 */
import './store';
import DiscoverBlocksPanel from './components/discover-blocks-panel';

function DownloadableBlocks( { onSelect, filterValue } ) {
	return (
		<div>
			<DiscoverBlocksPanel
				onSelect={ onSelect }
				filterValue={ filterValue }
			/>
		</div>
	);
}

export default DownloadableBlocks;
