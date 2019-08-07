/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

function DownloadableBlockAuthorInfo( { author } ) {
	return (
		<Fragment>
			<span className="block-directory-downloadable-block-author-info__content-author">
				Authored by <strong>{ author }</strong>
			</span>
			<span className="block-directory-downloadable-block-author-info__content">
				This author has <strong>X</strong> blocks, with an average rating of <strong>X.X</strong>.
			</span>
			<span className="block-directory-downloadable-block-author-info__content">
				They have an average support time of <strong>X days</strong>.
			</span>
		</Fragment>
	);
}

export default DownloadableBlockAuthorInfo;
