/**
 * External dependencies
 */
import { isUndefined, pickBy } from 'lodash';
import moment from 'moment';
import classnames from 'classnames';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Toolbar, Spinner, withAPIData } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import QueryPanel from '../../query-panel';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import RangeControl from '../../inspector-controls/range-control';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const MAX_POSTS_COLUMNS = 6;

class LatestPostsBlock extends Component {
	constructor() {
		super( ...arguments );

		this.toggleDisplayPostDate = this.toggleDisplayPostDate.bind( this );
	}

	toggleDisplayPostDate() {
		const { displayPostDate } = this.props.attributes;
		const { setAttributes } = this.props;

		setAttributes( { displayPostDate: ! displayPostDate } );
	}

	render() {
		const latestPosts = this.props.latestPosts.data;
		const { attributes, focus, setAttributes } = this.props;
		const { displayPostDate, align, layout, columns, order, orderBy, categories, postsToShow } = attributes;

		const inspectorControls = focus && (
			<InspectorControls key="inspector">
				<h3>{ __( 'Latest Posts Settings' ) }</h3>
				<QueryPanel
					{ ...{ order, orderBy } }
					numberOfItems={ postsToShow }
					category={ categories }
					onOrderChange={ ( value ) => setAttributes( { order: value } ) }
					onOrderByChange={ ( value ) => setAttributes( { orderBy: value } ) }
					onCategoryChange={ ( value ) => setAttributes( { categories: '' !== value ? value : undefined } ) }
					onNumberOfItemsChange={ ( value ) => setAttributes( { postsToShow: value } ) }
				/>
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
			</InspectorControls>
		);

		const hasPosts = Array.isArray( latestPosts ) && latestPosts.length;
		if ( ! hasPosts ) {
			return [
				inspectorControls,
				<Placeholder key="placeholder"
					icon="admin-post"
					label={ __( 'Latest Posts' ) }
				>
					{ ! Array.isArray( latestPosts ) ?
						<Spinner /> :
						__( 'No posts found.' )
					}
				</Placeholder>,
			];
		}

		// Removing posts from display should be instant.
		const postsDifference = latestPosts.length - postsToShow;
		if ( postsDifference > 0 ) {
			latestPosts.splice( postsToShow, postsDifference );
		}

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
			inspectorControls,
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
}

export default withAPIData( ( props ) => {
	const { postsToShow, order, orderBy, categories } = props.attributes;
	const queryString = stringify( pickBy( {
		categories,
		order,
		orderBy,
		per_page: postsToShow,
	}, value => ! isUndefined( value ) ) );
	return {
		latestPosts: `/wp/v2/posts?${ queryString }`,
	};
} )( LatestPostsBlock );
