/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DownloadableBlockAuthorInfo from '../downloadable-block-author-info';
import DownloadableBlockHeader from '../downloadable-block-header';
import DownloadableBlockInfo from '../downloadable-block-info';
import DownloadableBlockNotice from '../downloadable-block-notice';
import { store as blockDirectoryStore } from '../../store';

export default function DownloadableBlockListItem( { item, onClick } ) {
	const { isLoading, isInstallable } = useSelect(
		( select ) => {
			const { isInstalling, getErrorNoticeForBlock } = select(
				blockDirectoryStore
			);
			const notice = getErrorNoticeForBlock( item.id );
			const hasFatal = notice && notice.isFatal;
			return {
				isLoading: isInstalling( item.id ),
				isInstallable: ! hasFatal,
			};
		},
		[ item ]
	);

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
						isLoading={ isLoading }
						isInstallable={ isInstallable }
					/>
				</header>
				<section className="block-directory-downloadable-block-list-item__body">
					<DownloadableBlockNotice
						onClick={ onClick }
						block={ item }
					/>
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
