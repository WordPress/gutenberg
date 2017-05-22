/**
 * WordPress dependencies
 */
import Placeholder from 'components/placeholder';

/**
 * Internal dependencies
 */
import { registerBlock, query } from '../../api';
import Editable from '../../editable';

const { attr, children } = query;

function getLatestPosts( postsToShow = 5 ) {
	const postsCollection = new wp.api.collections.Posts();

	const posts = postsCollection.fetch( {
		data: {
			per_page: postsToShow
		}
	} );

	return posts;
}

function renderList( posts ) {
	console.log( posts );
	return (
		<ul>
			<li>post</li>
		</ul>
	);
}

let latestPosts = null;

registerBlock( 'core/rest-api-latest-posts', {
	title: wp.i18n.__( 'Latest Posts' ),

	icon: 'list-view',

	category: 'rest-api',


	edit( { attributes, setAttributes, focus, setFocus } ) {
		getLatestPosts().then( posts => latestPosts = posts );

		if ( ! latestPosts ) {
			return (
				<Placeholder
					icon="update"
					label={ wp.i18n.__( 'Loading latest posts, please wait' ) }
				>
				</Placeholder>
			);
		}

		return (
			<div className="blocks-rest-api-latest-posts">
				{ renderList( latestPosts ) }
			</div>
		);
	},

	save( { attributes } ) {
		return (
			<div>
				hello
			</div>
		);
	},
} );
