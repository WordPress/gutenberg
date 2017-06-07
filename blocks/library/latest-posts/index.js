/**
 * WordPress dependencies
 */
import { Placeholder } from 'components';

/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';
import { getLatestPosts } from './data.js';

registerBlockType( 'core/latestposts', {
	title: wp.i18n.__( 'Latest Posts' ),

	icon: 'list-view',

	category: 'rest-api',

	defaultAttributes: {
		poststoshow: 5,
	},

	edit: class extends wp.element.Component {
		constructor() {
			super( ...arguments );

			const { poststoshow } = this.props.attributes;

			this.state = {
				latestPosts: [],
				latestPostsRequest: getLatestPosts( poststoshow ),
			};

			this.state.latestPostsRequest
				.then( latestPosts => this.setState( { latestPosts } ) );
		}

		render() {
			const { latestPosts } = this.state;

			if ( ! latestPosts.length ) {
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
					<ul>
						{ latestPosts.map( ( post, i ) =>
							<li key={ i }><a href={ post.link }>{ post.title.rendered }</a></li>
						) }
					</ul>
				</div>
			);
		}
	},

	componentWillUnmount() {
		const { latestPostsRequest } = this.state;

		if ( latestPostsRequest.state() === 'pending' ) {
			latestPostsRequest.abort();
		}
	},

	save() {
		return null;
	},
} );
