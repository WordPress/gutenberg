/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

function DownloadableBlockAuthorInfo( { author, authorBlockCount, authorBlockRating } ) {
	return (
		<Fragment>
			<span className="block-directory-downloadable-block-author-info__content-author">
				{ sprintf( __( 'Authored by %s' ), author ) }
			</span>
			<span className="block-directory-downloadable-block-author-info__content">
				{ sprintf(
					_n(
						'This author has %d block, with an average rating of %d.',
						'This author has %d blocks, with an average rating of %d.',
						authorBlockCount
					),
					authorBlockCount,
					authorBlockRating
				) }
			</span>
		</Fragment>
	);
}

export default DownloadableBlockAuthorInfo;
