/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Placeholder, FormToggle, withInstanceId } from 'components';
import { __ } from 'i18n';
import moment from 'moment';

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

	edit: withInstanceId( class extends Component {
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
			let { poststoshow: postToShowNext } = nextProps.attributes;
			const { setAttributes } = this.props;

			postToShowNext = parseInt( postToShowNext );

			if ( postToShowCurrent === postToShowNext ) {
				return;
			}

			if ( ! isNaN( postToShowNext ) && postToShowNext > 0 && postToShowNext <= 100 ) {
				this.latestPostsRequest = getLatestPosts( postToShowNext );

				this.latestPostsRequest
					.then( latestPosts => this.setState( { latestPosts } ) );

				setAttributes( { poststoshow: postToShowNext } );
			}
		}

		changePostsToShow( postsToShow ) {
			const { setAttributes } = this.props;

			setAttributes( { poststoshow: postsToShow } );
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

			const { focus, instanceId } = this.props;
			const { displayPostDate } = this.props.attributes;

			const displayPostDateId = `post-date-toggle-${ instanceId }`;
			const postToShowId = `post-to-show-${ instanceId }`;

			return [
				focus && (
					<InspectorControls key="inspector">
						<div className="editor-latest-posts__row">
							<label htmlFor={ displayPostDateId }>{ __( 'Display post date' ) }</label>
							<FormToggle
								id={ displayPostDateId }
								checked={ displayPostDate }
								onChange={ this.toggleDisplayPostDate }
								showHint={ false }
							/>
						</div>
						<div className="editor-latest-posts__row">
							<label htmlFor={ postToShowId }>{ __( 'Number of posts to show' ) } </label>
							<input
								type="text"
								value={ this.props.attributes.poststoshow }
								ref={ postToShowId }
								id={ postToShowId }
								className="editor-latest-posts__input"
								onChange={ () => this.changePostsToShow( this.refs[ postToShowId ].value ) }
							/>
						</div>
					</InspectorControls>
				),
				<div className={ this.props.className } key="latest-posts">
					<ul className="blocks-latest-posts__list">
						{ latestPosts.map( ( post, i ) =>
							<li key={ i }>
								<a href={ post.link }>{ post.title.rendered }</a>
								{ displayPostDate && post.date_gmt &&
									(
										<span className="blocks-latest-posts__post-date">
											{ moment( post.date_gmt ).local().format( 'MMM DD h:mm A' ) }
										</span>
									)
								}
							</li>
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
	} ),

	save() {
		return null;
	},
} );
