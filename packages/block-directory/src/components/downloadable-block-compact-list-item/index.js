/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';

function DownloadableBlockCompactListItem( { item } ) {
	const { icon, title } = item;

	return (
		<li className="block-directory-downloadable-block-compact-list-item">
			<BlockIcon icon={ icon } showColors />

			<div className="block-directory-downloadable-block-compact-list-item__title">
				{ title }
			</div>
		</li>
	);
}

export default DownloadableBlockCompactListItem;
