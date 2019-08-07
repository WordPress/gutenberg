/**
 * Internal dependencies
 */
import DownloadableBlockHeader from '../downloadable-block-header';
import DownloadableBlockAuthorInfo from '../downloadable-block-author-info';
import DownloadableBlockInfo from '../downloadable-block-info';

function DownloadableBlockListItem( {
	item,
	onClick,
} ) {
	const {
		icon,
		title,
		description,
		rating,
		activeInstalls,
		ratingCount,
		author,
		humanizedUpdated,
	} = item;

	return (
		<li className="block-directory-downloadable-block-list-item">
			<div className="block-directory-downloadable-block-list-item__panel">
				<div className="block-directory-downloadable-block-list-item__header">
					<DownloadableBlockHeader
						icon={ icon }
						onClick={ onClick }
						title={ title }
						rating={ rating }
						ratingCount={ ratingCount }
					/>
				</div>
				<div className="block-directory-downloadable-block-list-item__body">
					<DownloadableBlockInfo
						activeInstalls={ activeInstalls }
						description={ description }
						humanizedUpdated={ humanizedUpdated }
					/>
				</div>
				<div className="block-directory-downloadable-block-list-item__footer">
					<DownloadableBlockAuthorInfo
						author={ author }
					/>
				</div>
			</div>
		</li>
	);
}

export default DownloadableBlockListItem;
