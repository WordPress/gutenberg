/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Placeholder } from 'components';
import { __ } from 'i18n';
import moment from 'moment';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType } from '../../api';
import { getLatestPosts } from './data.js';
import InspectorControls from '../../inspector-controls';
import TextControl from '../../inspector-controls/text-control';
import ToggleControl from '../../inspector-controls/toggle-control';

const MIN_POSTS = 1;
const MAX_POSTS = 100;

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
			this.changePostsToShow = this.changePostsToShow.bind( this );

			const { poststoshow } = this.props.attributes;

			this.state = {
				latestPosts: [],
			};

			this.latestPostsRequest = getLatestPosts( poststoshow );

			this.latestPostsRequest
				.then( latestPosts => this.setState( { latestPosts } ) );

			this.toggleDisplayPostDate = this.toggleDisplayPostDate.bind( this );
		}

		toggleDisplayPostDate() {
			const { displayPostDate } = this.props.attributes;
			const { setAttributes } = this.props;

			setAttributes( { displayPostDate: ! displayPostDate } );
		}

		componentWillReceiveProps( nextProps ) {
			const { poststoshow: postToShowCurrent } = this.props.attributes;
			const { poststoshow: postToShowNext } = nextProps.attributes;
			const { setAttributes } = this.props;

			if ( postToShowCurrent === postToShowNext ) {
				return;
			}

			if ( postToShowNext >= MIN_POSTS && postToShowNext <= MAX_POSTS ) {
				this.latestPostsRequest = getLatestPosts( postToShowNext );

				this.latestPostsRequest
					.then( latestPosts => this.setState( { latestPosts } ) );

				setAttributes( { poststoshow: postToShowNext } );
			}
		}

		changePostsToShow( postsToShow ) {
			const { setAttributes } = this.props;

			setAttributes( { poststoshow: parseInt( postsToShow, 10 ) || 0 } );
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

			return [
				focus && (
					<InspectorControls key="inspector">
						<ToggleControl
							label={ __( 'Display post date' ) }
							checked={ displayPostDate }
							onChange={ this.toggleDisplayPostDate }
						/>
						<TextControl
							label={ __( 'Number of posts to show' ) }
							type="number"
							min={ MIN_POSTS }
							max={ MAX_POSTS }
							value={ this.props.attributes.poststoshow }
							onChange={ ( value ) => this.changePostsToShow( value ) }
						/>
					</InspectorControls>
				),
				<ul className={ this.props.className } key="latest-posts">
					{ latestPosts.map( ( post, i ) =>
						<li key={ i }>
							<a href={ post.link }>{ post.title.rendered }</a>
							{ displayPostDate && post.date_gmt &&
								<span className={ `${ this.props.className }__post-date` }>
									{ moment( post.date_gmt ).local().format( 'MMM DD h:mm A' ) }
								</span>
							}
						</li>
					) }
				</ul>,
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
