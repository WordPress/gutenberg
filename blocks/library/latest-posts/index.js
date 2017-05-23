/**
 * WordPress dependencies
 */
import Placeholder from 'components/placeholder';

/**
 * Internal dependencies
 */
import { registerBlock } from '../../api';

function getLatestPosts( postsToShow = 5 ) {
	const postsCollection = new wp.api.collections.Posts();

	const posts = postsCollection.fetch( {
		data: {
			per_page: postsToShow
		}
	} );

	return posts;
}

function renderList( latestPosts ) {
	return (
		<ul>
			{ latestPosts.map( (post) =>
				<li><a href={ post.link }>{ post.title.rendered }</a></li>
			) }
		</ul>
	);
}

registerBlock( 'core/latest-posts', {
	title: wp.i18n.__( 'Latest Posts' ),

	icon: 'list-view',

	category: 'rest-api',

	edit( { attributes, setAttributes } ) {
		const { latestPosts } = attributes;

		if ( ! latestPosts ) {
			getLatestPosts().then( latestPosts => setAttributes( { latestPosts } ) );

			return (
				<Placeholder
					icon="update"
					label={ wp.i18n.__( 'Loading latest posts, please wait' ) }
				>
				</Placeholder>
			);
		}

		return (
			<div className="blocks-latest-posts">
				{ renderList( latestPosts ) }
			</div>
		);
	},

	save( { attributes } ) {
		const { latestPosts } = attributes;

		return (
			<div>
				{ renderList( latestPosts ) }
			</div>
		);
	},
} );
