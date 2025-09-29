/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { PostPublishTitlePanel } from './postpublish-title-panel';
import { PostPublishNextPanel } from './postpublish-next-panel';

const POSTNAME = '%postname%';
const PAGENAME = '%pagename%';

/**
 * Returns URL for a future post.
 *
 * @param {Object} post Post object.
 *
 * @return {string} PostPublish URL.
 */

const getFuturePostUrl = ( post ) => {
	const { slug } = post;

	if ( post.permalink_template.includes( POSTNAME ) ) {
		return post.permalink_template.replace( POSTNAME, slug );
	}

	if ( post.permalink_template.includes( PAGENAME ) ) {
		return post.permalink_template.replace( PAGENAME, slug );
	}

	return post.permalink_template;
};

export default function PostPublishPanelPostpublish( {
	focusOnMount,
	children,
} ) {
	const { post, postType, isScheduled } = useSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getCurrentPost,
			isCurrentPostScheduled,
		} = select( editorStore );
		const { getPostType } = select( coreStore );

		return {
			post: getCurrentPost(),
			postType: getPostType( getEditedPostAttribute( 'type' ) ),
			isScheduled: isCurrentPostScheduled(),
		};
	}, [] );
	const link =
		post.status === 'future' ? getFuturePostUrl( post ) : post.link;

	return (
		<div className="post-publish-panel__postpublish">
			<PanelBody className="post-publish-panel__postpublish-header">
				<PostPublishTitlePanel
					post={ post }
					isScheduled={ isScheduled }
					focusOnMount={ focusOnMount }
					link={ link }
				/>
			</PanelBody>
			<PanelBody>
				<PostPublishNextPanel
					post={ post }
					postType={ postType }
					isScheduled={ isScheduled }
					focusOnMount={ focusOnMount }
					link={ link }
				/>
			</PanelBody>
			{ children }
		</div>
	);
}
