/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Placeholder, FormToggle } from 'components';
import { __ } from 'i18n';
import moment from 'moment';
import { withInstanceId } from 'components';

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
