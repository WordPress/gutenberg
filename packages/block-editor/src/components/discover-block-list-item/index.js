/**
 * Internal dependencies
 */
import DiscoverBlockHeader from '../discover-block-header';
import DiscoverBlockAuthorInfo from '../discover-block-author-info';
import DiscoverBlockInfo from '../discover-block-info';

function DiscoverBlockListItem( {
	item,
	onClick,
} ) {
	const {
		icons,
		title,
		description,
		rating,
		activeInstalls,
		ratingCount,
		author,
	} = item;

	return (
		<li className="block-editor-discover-block-list-item">
			<div className="block-editor-discover-block-list-item__panel">
				<div className="block-editor-discover-block-list-item__header">
					<DiscoverBlockHeader
						icons={ icons }
						onClick={ onClick }
						title={ title }
						rating={ rating }
						ratingCount={ ratingCount }
					/>
				</div>
				<div className="block-editor-discover-block-list-item__body">
					<DiscoverBlockInfo
						activeInstalls={ activeInstalls }
						description={ description }
					/>
				</div>
				<div className="block-editor-discover-block-list-item__footer">
					<DiscoverBlockAuthorInfo
						author={ author }
					/>
				</div>
			</div>
		</li>
	);
}

export default DiscoverBlockListItem;
