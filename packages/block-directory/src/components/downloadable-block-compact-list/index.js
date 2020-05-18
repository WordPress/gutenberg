/**
 * Internal dependencies
 */
import DownloadableBlockCompactListItem from '../downloadable-block-compact-list-item';

function DownloadableBlockCompactList( { items } ) {
	if ( ! items.length ) {
		return null;
	}

	return (
		<ul className="downloadable-block-compact-list">
			{ items.map( ( block ) => (
				<DownloadableBlockCompactListItem
					key={ block.id }
					item={ block }
				/>
			) ) }
		</ul>
	);
}

export default DownloadableBlockCompactList;
