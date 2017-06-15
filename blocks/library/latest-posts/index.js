/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Placeholder, FormToggle } from 'components';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType } from '../../api';
import { getLatestPosts } from './data.js';
import InspectorControls from '../../inspector-controls';

registerBlockType( 'core/latestposts', {
	title: __( 'Latest Posts' ),

	icon: 'list-view',

	category: 'widgets',

	defaultAttributes: {
		poststoshow: 5,
		displayPostDate: false,
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );

			const { poststoshow, displayPostDate } = this.props.attributes;

			this.state = {
				latestPosts: [],
			};

			this.latestPostsRequest = getLatestPosts( poststoshow, displayPostDate );

			this.latestPostsRequest
				.then( latestPosts => this.setState( { latestPosts } ) );

			this.toggleDisplayPostDate = this.toggleDisplayPostDate.bind( this );
		}

		toggleDisplayPostDate() {
			const { displayPostDate } = this.props.attributes;
			const { setAttributes } = this.props;

			setAttributes( { displayPostDate: ! displayPostDate } );
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

			const { focus } = this.props;
			const { displayPostDate } = this.props.attributes;

			const displayPostDateId = 'post-date-toggle';

			return [
				focus && (
					<InspectorControls key="inspector">
						<div className="editor-latest-posts__row">
							<label htmlFor={ displayPostDateId }>{ __( 'Display post date?' ) }</label>
							<FormToggle
								id={ displayPostDateId }
								checked={ displayPostDate }
								onChange={ this.toggleDisplayPostDate }
								showHint={ false }
							/>
						</div>
					</InspectorControls>
				),
				<div className={ this.props.className } key="latest-posts">
					<ul>
						{ latestPosts.map( ( post, i ) =>
							<li key={ i }><a href={ post.link }>{ post.title.rendered }</a></li>
						) }
					</ul>
				</div>,
			];
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
