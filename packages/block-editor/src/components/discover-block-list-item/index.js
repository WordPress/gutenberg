/**
 * Internal dependencies
 */
import DiscoverBlockHeader from '../discover-block-header';
import DiscoverBlockAuthorInfo from '../discover-block-author-info';
import DiscoverBlockInfo from '../discover-block-info';

function DiscoverBlockListItem( {
	icon,
	onClick,
	title,
	description,
} ) {
	return (
		<li className="block-editor-discover-block-list-item">
			<div className="block-editor-discover-block-list-item__panel">
				<div className="block-editor-discover-block-list-item__header">
					<DiscoverBlockHeader icon={ icon } onClick={ onClick } title={ title } />
				</div>
				<div className="block-editor-discover-block-list-item__body">
					<DiscoverBlockInfo description={ description } />
				</div>
				<div className="block-editor-discover-block-list-item__footer">
					<DiscoverBlockAuthorInfo />
				</div>
			</div>
		</li>
	);
}

export default DiscoverBlockListItem;
