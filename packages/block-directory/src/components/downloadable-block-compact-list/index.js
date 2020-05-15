/**
 * WordPress dependencies
 */
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import DownloadableBlockCompactListItem from '../downloadable-block-compact-list-item';

function DownloadableBlockCompactList( { items } ) {
	if ( ! items.length ) {
		return null;
	}

	const blockTypes = getBlockTypes();

	return (
		<ul className="downloadable-block-compact-list">
			{ items.map( ( block ) => {
				const [ blockDetails ] = blockTypes.filter(
					( b ) => b.name === block.name
				);

				if ( blockDetails ) {
					return (
						<DownloadableBlockCompactListItem
							item={ blockDetails }
						/>
					);
				}
				return null;
			} ) }
		</ul>
	);
}

export default DownloadableBlockCompactList;
