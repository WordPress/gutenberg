/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

function DiscoverBlockAuthorInfo() {
	return (
		<Fragment>
			<span className="block-editor-discover-block-author-info__content-author">
				Authored by <strong>XXX</strong>
			</span>
			<span className="block-editor-discover-block-author-info__content">
				This author has <strong>X</strong> blocks, with an average rating of <strong>X.X</strong>.
			</span>
			<span className="block-editor-discover-block-author-info__content">
				They have an average support time of <strong>X days</strong>.
			</span>
		</Fragment>
	);
}

export default DiscoverBlockAuthorInfo;
