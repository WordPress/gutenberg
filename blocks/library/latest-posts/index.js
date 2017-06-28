/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Placeholder } from 'components';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import { registerBlockType } from '../../api';
import { getLatestPosts } from './data.js';

registerBlockType( 'core/latestposts', {
	title: __( 'Latest Posts' ),

	icon: 'list-view',

	category: 'widgets',

	defaultAttributes: {
		poststoshow: 5,
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );

			const { poststoshow } = this.props.attributes;

			this.state = {
				latestPosts: [],
			};

			this.latestPostsRequest = getLatestPosts( poststoshow );

			this.latestPostsRequest
				.then( latestPosts => this.setState( { latestPosts } ) );
		}

		render() {
			const { latestPosts } = this.state;

			if ( ! latestPosts.length ) {
				return (
					<Placeholder
						icon="update"
						label={ __( 'Loading latest posts, please wait' ) }
					>
					</Placeholder>
				);
			}

			return (
				<div className={ this.props.className }>
					<ul>
						{ latestPosts.map( ( post, i ) =>
							<li key={ i }><a href={ post.link }>{ post.title.rendered }</a></li>
						) }
					</ul>
				</div>
			);
		}

		componentWillUnmount() {
			if ( this.latestPostsRequest.state() === 'pending' ) {
				this.latestPostsRequest.abort();
			}
		}
	},

	save() {
		return null;
	},
} );
