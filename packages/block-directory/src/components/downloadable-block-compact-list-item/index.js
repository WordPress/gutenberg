/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';

function DownloadableBlockCompactListItem( { item } ) {
	return (
		<li className="block-directory-downloadable-block-compact-list-item">
			<BlockIcon icon={ item.icon } showColors />

			<div className="block-directory-downloadable-block-compact-list-item__title">
				{ item.title }
			</div>
		</li>
	);
}

export default DownloadableBlockCompactListItem;
