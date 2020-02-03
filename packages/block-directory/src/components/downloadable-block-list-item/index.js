/**
 * Internal dependencies
 */
import DownloadableBlockHeader from '../downloadable-block-header';
import DownloadableBlockAuthorInfo from '../downloadable-block-author-info';
import DownloadableBlockInfo from '../downloadable-block-info';

function DownloadableBlockListItem( { item, onClick } ) {
	const {
		icon,
		title,
		description,
		rating,
		activeInstalls,
		ratingCount,
		author,
		humanizedUpdated,
		authorBlockCount,
		authorBlockRating,
	} = item;

	return (
		<li className="block-directory-downloadable-block-list-item">
			<article className="block-directory-downloadable-block-list-item__panel">
				<header className="block-directory-downloadable-block-list-item__header">
					<DownloadableBlockHeader
						icon={ icon }
						onClick={ onClick }
						title={ title }
						rating={ rating }
						ratingCount={ ratingCount }
					/>
				</header>
				<section className="block-directory-downloadable-block-list-item__body">
					<DownloadableBlockInfo
						activeInstalls={ activeInstalls }
						description={ description }
						humanizedUpdated={ humanizedUpdated }
					/>
				</section>
				<footer className="block-directory-downloadable-block-list-item__footer">
					<DownloadableBlockAuthorInfo
						author={ author }
						authorBlockCount={ authorBlockCount }
						authorBlockRating={ authorBlockRating }
					/>
				</footer>
			</article>
		</li>
	);
}

export default DownloadableBlockListItem;
