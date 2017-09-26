/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Toolbar, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/utils';
import moment from 'moment';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType } from '../../api';
import { getLatestPosts } from './data.js';
import InspectorControls from '../../inspector-controls';
import TextControl from '../../inspector-controls/text-control';
import ToggleControl from '../../inspector-controls/toggle-control';
import RangeControl from '../../inspector-controls/range-control';
import BlockDescription from '../../block-description';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const MIN_POSTS = 1;
const MAX_POSTS = 100;
const MAX_POSTS_COLUMNS = 6;

registerBlockType( 'core/latest-posts', {
	title: __( 'Latest Posts' ),

	icon: 'list-view',

	category: 'widgets',

	keywords: [ __( 'recent posts' ) ],

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

			// Removing posts from display should be instant.
			const postsDifference = latestPosts.length - this.props.attributes.postsToShow;
			if ( postsDifference > 0 ) {
				latestPosts.splice( this.props.attributes.postsToShow, postsDifference );
			}

			const { focus } = this.props;
			const { displayPostDate, align, layout, columns } = this.props.attributes;
			const layoutControls = [
				{
					icon: 'list-view',
					title: __( 'List View' ),
					onClick: () => setAttributes( { layout: 'list' } ),
					isActive: layout === 'list',
				},
				{
					icon: 'grid-view',
					title: __( 'Grid View' ),
					onClick: () => setAttributes( { layout: 'grid' } ),
					isActive: layout === 'grid',
				},
			];

			return [
				focus && (
					<BlockControls key="controls">
						<BlockAlignmentToolbar
							value={ align }
							onChange={ ( nextAlign ) => {
								setAttributes( { align: nextAlign } );
							} }
							controls={ [ 'center', 'wide', 'full' ] }
						/>
						<Toolbar controls={ layoutControls } />
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
						{ layout === 'grid' &&
							<RangeControl
								label={ __( 'Columns' ) }
								value={ columns }
								onChange={ ( value ) => setAttributes( { columns: value } ) }
								min={ 2 }
								max={ Math.min( MAX_POSTS_COLUMNS, latestPosts.length ) }
							/>
						}
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
				<ul
					className={ classnames( this.props.className, 'columns-' + columns, {
						'is-grid': layout === 'grid',
					} ) }
					key="latest-posts"
				>
					{ latestPosts.map( ( post, i ) =>
						<li key={ i }>
							<a href={ post.link } target="_blank">{ decodeEntities( post.title.rendered.trim() ) || __( '(Untitled)' ) }</a>
							{ displayPostDate && post.date_gmt &&
								<time dateTime={ moment( post.date_gmt ).utc().format() } className={ `${ this.props.className }__post-date` }>
									{ moment( post.date_gmt ).local().format( 'MMMM DD, Y' ) }
								</time>
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
