/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import DownloadableBlockAuthorInfo from '../downloadable-block-author-info';
import DownloadableBlockHeader from '../downloadable-block-header';
import DownloadableBlockInfo from '../downloadable-block-info';
import DownloadableBlockNotice from '../downloadable-block-notice';

function DownloadableBlockListItem( { item, onClick, isLoading } ) {
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

export default withSelect( ( select, { item } ) => {
	return {
		isLoading: select( 'core/block-directory' ).isInstalling( item.id ),
	};
} )( DownloadableBlockListItem );
