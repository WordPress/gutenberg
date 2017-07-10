/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Placeholder, Spinner } from 'components';
import { __ } from 'i18n';
import moment from 'moment';

/**
 * Internal dependencies
 */
import './style.scss';
import './block.scss';
import { registerBlockType } from '../../api';
import { getLatestPosts } from './data.js';
import InspectorControls from '../../inspector-controls';
import TextControl from '../../inspector-controls/text-control';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockDescription from '../../block-description';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const MIN_POSTS = 1;
const MAX_POSTS = 100;

registerBlockType( 'core/latest-posts', {
	title: __( 'Latest Posts' ),

	icon: 'list-view',

	category: 'widgets',

	defaultAttributes: {
		postsToShow: 5,
		displayPostDate: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );
			this.changePostsToShow = this.changePostsToShow.bind( this );

			const { postsToShow } = this.props.attributes;

			this.state = {
				latestPosts: [],
			};

			this.latestPostsRequest = getLatestPosts( postsToShow );

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
			const { postsToShow: postToShowCurrent } = this.props.attributes;
			const { postsToShow: postToShowNext } = nextProps.attributes;
			const { setAttributes } = this.props;

			if ( postToShowCurrent === postToShowNext ) {
				return;
			}

			if ( postToShowNext >= MIN_POSTS && postToShowNext <= MAX_POSTS ) {
				this.latestPostsRequest = getLatestPosts( postToShowNext );

				this.latestPostsRequest
					.then( latestPosts => this.setState( { latestPosts } ) );

				setAttributes( { postsToShow: postToShowNext } );
			}
		}

		changePostsToShow( postsToShow ) {
			const { setAttributes } = this.props;

			setAttributes( { postsToShow: parseInt( postsToShow, 10 ) || 0 } );
		}

		render() {
			const { latestPosts } = this.state;
			const { setAttributes } = this.props;

			if ( ! latestPosts.length ) {
				return (
					<Placeholder
						icon="admin-post"
						label={ __( 'Latest Posts' ) }
					>
						<Spinner />
					</Placeholder>
				);
			}

			const { focus } = this.props;
			const { displayPostDate, align } = this.props.attributes;

			return [
				focus && (
					<BlockControls key="controls">
						<BlockAlignmentToolbar
							value={ align }
							onChange={ ( nextAlign ) => {
								setAttributes( { align: nextAlign } );
							} }
							controls={ [ 'left', 'center', 'right', 'wide', 'full' ] }
						/>
					</BlockControls>
				),
				focus && (
					<InspectorControls key="inspector">
						<BlockDescription>
							<p>{ __( 'Shows a list of your site\'s most recent posts.' ) }</p>
						</BlockDescription>
						<h3>{ __( 'Latest Posts Settings' ) }</h3>

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
							value={ this.props.attributes.postsToShow }
							onChange={ ( value ) => this.changePostsToShow( value ) }
						/>
					</InspectorControls>
				),
				<ul className={ this.props.className } key="latest-posts">
					{ latestPosts.map( ( post, i ) =>
						<li key={ i }>
							<a href={ post.link } target="_blank">{ post.title.rendered }</a>
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
