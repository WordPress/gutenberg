/**
 * WordPress dependencies
 */
import Placeholder from 'components/placeholder';

/**
 * Internal dependencies
 */
import { registerBlock } from '../../api';
import { getLatestPosts } from './data.js';

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
