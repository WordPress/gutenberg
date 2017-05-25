/**
 * WordPress dependencies
 */
import Placeholder from 'components/placeholder';

/**
 * Internal dependencies
 */
import { registerBlock } from '../../api';
import { getLatestPosts } from './data.js';


registerBlock( 'core/latestposts', {
	title: wp.i18n.__( 'Latest Posts' ),

	icon: 'list-view',

	category: 'rest-api',

	defaultAttributes: {
		poststoshow: 5
	},

	edit: class extends wp.element.Component {
		constructor() {
			super( ...arguments );

			this.state = {
				latestPosts: []
			};

			const { poststoshow } = this.props.attributes;

			getLatestPosts( poststoshow )
				.then( latestPosts => this.setState( { latestPosts } ) );
		}

		renderPostsLoading() {
			return (
				<Placeholder
					icon="update"
					label={ wp.i18n.__( 'Loading latest posts, please wait' ) }
				>
				</Placeholder>
			);
		}

		renderPostsList( latestPosts ) {
			return (
				<ul>
					{ latestPosts.map( (post) =>
						<li><a href={ post.link }>{ post.title.rendered }</a></li>
					) }
				</ul>
			);
		}

		render() {
			const { latestPosts } = this.state;

			if ( ! latestPosts.length ) {
				return this.renderPostsLoading();
			}

			return (
				<div className="blocks-latest-posts">
					{ this.renderPostsList( latestPosts ) }
				</div>
			);

		}

	},

	save() {
		return null;
	},
} );
