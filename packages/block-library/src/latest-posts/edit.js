/**
 * External dependencies
 */
import {
	compact,
	concat,
	find,
	get,
	invoke,
	isUndefined,
	pickBy,
	throttle,
	map,
	unescape as unescapeString,
} from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, RawHTML } from '@wordpress/element';
import {
	BaseControl,
	PanelBody,
	Placeholder,
	QueryControls,
	RadioControl,
	RangeControl,
	Spinner,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { dateI18n, format, __experimentalGetSettings } from '@wordpress/date';
import {
	InspectorControls,
	BlockAlignmentToolbar,
	BlockControls,
	__experimentalImageSizeControl as ImageSizeControl,
} from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';
import { pin, list, grid } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	MIN_EXCERPT_LENGTH,
	MAX_EXCERPT_LENGTH,
	MAX_POSTS_COLUMNS,
} from './constants';

/**
 * Module Constants
 */
const CATEGORIES_LIST_QUERY = {
	per_page: -1,
};
const TAG_LIST_QUERY = {
	per_page: -1,
	orderby: 'count',
	order: 'desc',
	_fields: 'id,name',
};

const isSameTermName = ( termA, termB ) =>
	termA.toLowerCase() === termB.toLowerCase();

/**
 * Returns a term object with name unescaped.
 * The unescape of the name property is done using lodash unescape function.
 *
 * @param {Object} term The term object to unescape.
 *
 * @return {Object} Term object with name property unescaped.
 */
const unescapeTerm = ( term ) => {
	return {
		...term,
		name: unescapeString( term.name ),
	};
};

/**
 * Returns an array of term objects with names unescaped.
 * The unescape of each term is performed using the unescapeTerm function.
 *
 * @param {Object[]} terms Array of term objects to unescape.
 *
 * @return {Object[]} Array of term objects unescaped.
 */
const unescapeTerms = ( terms ) => {
	return map( terms, unescapeTerm );
};

class LatestPostsEdit extends Component {
	constructor() {
		super( ...arguments );
		this.searchTerms = throttle( this.searchTerms.bind( this ), 500 );
		this.updateTags = this.updateTags.bind( this );
		this.tokenizeTags = this.tokenizeTags.bind( this );
		this.getTagsDetails = this.getTagsDetails.bind( this );
		this.getCategoriesDetails = this.getCategoriesDetails.bind( this );
		this.state = {
			categoriesList: [],
			tagsList: [],
			tokenizedTags: [],
			suggestedTags: [],
		};
	}

	tokenizeTags( tagsList ) {
		let tokenizedTags = [];
		if ( tagsList.length > 0 ) {
			tokenizedTags = tagsList.reduce( ( accumulator, tag ) => {
				accumulator.push( tag.name );
				return accumulator;
			}, [] );
		}
		this.setState( { tokenizedTags } );
	}

	updateTags( termNames ) {
		const { setAttributes } = this.props;
		const newTags = compact(
			concat(
				termNames.map( ( termName ) => {
					return find( this.state.suggestedTags, ( result ) => {
						return isSameTermName( result.name, termName );
					} );
				} ),
				termNames.map( ( termName ) => {
					return find( this.state.tagsList, ( result ) => {
						return isSameTermName( result.name, termName );
					} );
				} )
			)
		);
		const tagsIds = newTags.map( ( { id } ) => id );
		setAttributes( { tags: tagsIds } );
		this.getTagsDetails( tagsIds );
		this.tokenizeTags( newTags );
	}

	searchTerms( search = '' ) {
		invoke( this.searchRequest, [ 'abort' ] );
		this.searchRequest = this.fetchTerms( { search } );
	}

	fetchTerms( params = {} ) {
		const query = { ...TAG_LIST_QUERY, ...params };
		const request = apiFetch( {
			path: addQueryArgs( `/wp/v2/tags`, query ),
		} );
		request.then( unescapeTerms ).then( ( terms ) => {
			this.setState( ( state ) => ( {
				suggestedTags: terms.filter(
					( term ) =>
						! find( state.tagsList, ( tag ) => tag.id === term.id )
				),
			} ) );
		} );

		return request;
	}

	getTagsDetails( newTags = false ) {
		this.isStillMounted = true;
		let { tags } = this.props.attributes;
		if ( newTags ) {
			tags = newTags;
		}
		if ( tags && tags.length > 0 ) {
			this.fetchRequest = apiFetch( {
				path: addQueryArgs( `/wp/v2/tags`, {
					include: tags.join( ',' ),
				} ),
			} )
				.then( ( tagsList ) => {
					if ( this.isStillMounted ) {
						this.setState( { tagsList } );
						this.tokenizeTags( tagsList );
					}
				} )
				.catch( () => {
					if ( this.isStillMounted ) {
						this.setState( { tagsList: [] } );
						this.tokenizeTags( [] );
					}
				} );
		}
	}

	getCategoriesDetails() {
		this.isStillMounted = true;
		this.fetchRequest = apiFetch( {
			path: addQueryArgs( `/wp/v2/categories`, CATEGORIES_LIST_QUERY ),
		} )
			.then( ( categoriesList ) => {
				if ( this.isStillMounted ) {
					this.setState( { categoriesList } );
				}
			} )
			.catch( () => {
				if ( this.isStillMounted ) {
					this.setState( { categoriesList: [] } );
				}
			} );
	}

	componentDidMount() {
		this.getCategoriesDetails();
		this.getTagsDetails();
	}

	componentWillUnmount() {
		this.isStillMounted = false;
	}

	render() {
		const {
			attributes,
			setAttributes,
			imageSizeOptions,
			latestPosts,
			defaultImageWidth,
			defaultImageHeight,
		} = this.props;
		const { categoriesList, tokenizedTags, suggestedTags } = this.state;
		const {
			displayFeaturedImage,
			displayPostContentRadio,
			displayPostContent,
			displayPostDate,
			postLayout,
			columns,
			order,
			orderBy,
			categories,
			postsToShow,
			excerptLength,
			featuredImageAlign,
			featuredImageSizeSlug,
			featuredImageSizeWidth,
			featuredImageSizeHeight,
		} = attributes;
		const suggestions = categoriesList.reduce(
			( accumulator, category ) => ( {
				...accumulator,
				[ category.name ]: category,
			} ),
			{}
		);
		const categorySuggestions = categoriesList.reduce(
			( accumulator, category ) => ( {
				...accumulator,
				[ category.name ]: category,
			} ),
			{}
		);
		const selectCategories = ( tokens ) => {
			// Categories that are already will be objects, while new additions will be strings (the name).
			// allCategories nomalizes the array so that they are all objects.
			const allCategories = tokens.map( ( token ) =>
				typeof token === 'string' ? suggestions[ token ] : token
			);
			setAttributes( { categories: allCategories } );
		};

		const inspectorControls = (
			<InspectorControls>
				<PanelBody title={ __( 'Post content settings' ) }>
					<ToggleControl
						label={ __( 'Post content' ) }
						checked={ displayPostContent }
						onChange={ ( value ) =>
							setAttributes( { displayPostContent: value } )
						}
					/>
					{ displayPostContent && (
						<RadioControl
							label={ __( 'Show:' ) }
							selected={ displayPostContentRadio }
							options={ [
								{ label: __( 'Excerpt' ), value: 'excerpt' },
								{
									label: __( 'Full post' ),
									value: 'full_post',
								},
							] }
							onChange={ ( value ) =>
								setAttributes( {
									displayPostContentRadio: value,
								} )
							}
						/>
					) }
					{ displayPostContent &&
						displayPostContentRadio === 'excerpt' && (
							<RangeControl
								label={ __( 'Max number of words in excerpt' ) }
								value={ excerptLength }
								onChange={ ( value ) =>
									setAttributes( { excerptLength: value } )
								}
								min={ MIN_EXCERPT_LENGTH }
								max={ MAX_EXCERPT_LENGTH }
							/>
						) }
				</PanelBody>

				<PanelBody title={ __( 'Post meta settings' ) }>
					<ToggleControl
						label={ __( 'Display post date' ) }
						checked={ displayPostDate }
						onChange={ ( value ) =>
							setAttributes( { displayPostDate: value } )
						}
					/>
				</PanelBody>

				<PanelBody title={ __( 'Featured image settings' ) }>
					<ToggleControl
						label={ __( 'Display featured image' ) }
						checked={ displayFeaturedImage }
						onChange={ ( value ) =>
							setAttributes( { displayFeaturedImage: value } )
						}
					/>
					{ displayFeaturedImage && (
						<>
							<ImageSizeControl
								onChange={ ( value ) => {
									const newAttrs = {};
									if ( value.hasOwnProperty( 'width' ) ) {
										newAttrs.featuredImageSizeWidth =
											value.width;
									}
									if ( value.hasOwnProperty( 'height' ) ) {
										newAttrs.featuredImageSizeHeight =
											value.height;
									}
									setAttributes( newAttrs );
								} }
								slug={ featuredImageSizeSlug }
								width={ featuredImageSizeWidth }
								height={ featuredImageSizeHeight }
								imageWidth={ defaultImageWidth }
								imageHeight={ defaultImageHeight }
								imageSizeOptions={ imageSizeOptions }
								onChangeImage={ ( value ) =>
									setAttributes( {
										featuredImageSizeSlug: value,
										featuredImageSizeWidth: undefined,
										featuredImageSizeHeight: undefined,
									} )
								}
							/>
							<BaseControl>
								<BaseControl.VisualLabel>
									{ __( 'Image alignment' ) }
								</BaseControl.VisualLabel>
								<BlockAlignmentToolbar
									value={ featuredImageAlign }
									onChange={ ( value ) =>
										setAttributes( {
											featuredImageAlign: value,
										} )
									}
									controls={ [ 'left', 'center', 'right' ] }
									isCollapsed={ false }
								/>
							</BaseControl>
						</>
					) }
				</PanelBody>

				<PanelBody title={ __( 'Sorting and filtering' ) }>
					<QueryControls
						{ ...{ order, orderBy } }
						numberOfItems={ postsToShow }
						onOrderChange={ ( value ) =>
							setAttributes( { order: value } )
						}
						onOrderByChange={ ( value ) =>
							setAttributes( { orderBy: value } )
						}
						onNumberOfItemsChange={ ( value ) =>
							setAttributes( { postsToShow: value } )
						}
						categorySuggestions={ categorySuggestions }
						onCategoryChange={ selectCategories }
						selectedCategories={ categories }
						selectedTags={ tokenizedTags }
						onTagsChange={ this.updateTags }
						onTagInputChage={ this.searchTerms }
						suggestedTags={ suggestedTags.map(
							( tag ) => tag.name
						) }
					/>

					{ postLayout === 'grid' && (
						<RangeControl
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ ( value ) =>
								setAttributes( { columns: value } )
							}
							min={ 2 }
							max={
								! hasPosts
									? MAX_POSTS_COLUMNS
									: Math.min(
											MAX_POSTS_COLUMNS,
											latestPosts.length
									  )
							}
							required
						/>
					) }
				</PanelBody>
			</InspectorControls>
		);

		const hasPosts = Array.isArray( latestPosts ) && latestPosts.length;
		if ( ! hasPosts ) {
			return (
				<>
					{ inspectorControls }
					<Placeholder icon={ pin } label={ __( 'Latest Posts' ) }>
						{ ! Array.isArray( latestPosts ) ? (
							<Spinner />
						) : (
							__( 'No posts found.' )
						) }
					</Placeholder>
				</>
			);
		}

		// Removing posts from display should be instant.
		const displayPosts =
			latestPosts.length > postsToShow
				? latestPosts.slice( 0, postsToShow )
				: latestPosts;

		const layoutControls = [
			{
				icon: list,
				title: __( 'List view' ),
				onClick: () => setAttributes( { postLayout: 'list' } ),
				isActive: postLayout === 'list',
			},
			{
				icon: grid,
				title: __( 'Grid view' ),
				onClick: () => setAttributes( { postLayout: 'grid' } ),
				isActive: postLayout === 'grid',
			},
		];

		const dateFormat = __experimentalGetSettings().formats.date;

		return (
			<>
				{ inspectorControls }
				<BlockControls>
					<ToolbarGroup controls={ layoutControls } />
				</BlockControls>
				<ul
					className={ classnames( this.props.className, {
						'wp-block-latest-posts__list': true,
						'is-grid': postLayout === 'grid',
						'has-dates': displayPostDate,
						[ `columns-${ columns }` ]: postLayout === 'grid',
					} ) }
				>
					{ displayPosts.map( ( post, i ) => {
						const titleTrimmed = invoke( post, [
							'title',
							'rendered',
							'trim',
						] );
						let excerpt = post.excerpt.rendered;

						const excerptElement = document.createElement( 'div' );
						excerptElement.innerHTML = excerpt;

						excerpt =
							excerptElement.textContent ||
							excerptElement.innerText ||
							'';

						const imageSourceUrl = post.featuredImageSourceUrl;

						const imageClasses = classnames( {
							'wp-block-latest-posts__featured-image': true,
							[ `align${ featuredImageAlign }` ]: !! featuredImageAlign,
						} );

						const postExcerpt =
							excerptLength <
								excerpt.trim().split( ' ' ).length &&
							post.excerpt.raw === ''
								? excerpt
										.trim()
										.split( ' ', excerptLength )
										.join( ' ' ) +
								  ' ... <a href="' +
								  post.link +
								  '" target="_blank" rel="noopener noreferrer">' +
								  __( 'Read more' ) +
								  '</a>'
								: excerpt;

						return (
							<li key={ i }>
								{ displayFeaturedImage && (
									<div className={ imageClasses }>
										{ imageSourceUrl && (
											<img
												src={ imageSourceUrl }
												alt=""
												style={ {
													maxWidth: featuredImageSizeWidth,
													maxHeight: featuredImageSizeHeight,
												} }
											/>
										) }
									</div>
								) }
								<a
									href={ post.link }
									target="_blank"
									rel="noreferrer noopener"
								>
									{ titleTrimmed ? (
										<RawHTML>{ titleTrimmed }</RawHTML>
									) : (
										__( '(no title)' )
									) }
								</a>
								{ displayPostDate && post.date_gmt && (
									<time
										dateTime={ format(
											'c',
											post.date_gmt
										) }
										className="wp-block-latest-posts__post-date"
									>
										{ dateI18n(
											dateFormat,
											post.date_gmt
										) }
									</time>
								) }
								{ displayPostContent &&
									displayPostContentRadio === 'excerpt' && (
										<div className="wp-block-latest-posts__post-excerpt">
											<RawHTML key="html">
												{ postExcerpt }
											</RawHTML>
										</div>
									) }
								{ displayPostContent &&
									displayPostContentRadio === 'full_post' && (
										<div className="wp-block-latest-posts__post-full-content">
											<RawHTML key="html">
												{ post.content.raw.trim() }
											</RawHTML>
										</div>
									) }
							</li>
						);
					} ) }
				</ul>
			</>
		);
	}
}

export default withSelect( ( select, props ) => {
	const {
		featuredImageSizeSlug,
		postsToShow,
		order,
		orderBy,
		categories,
		tags,
	} = props.attributes;
	const { getEntityRecords, getMedia } = select( 'core' );
	const { getSettings } = select( 'core/block-editor' );
	const { imageSizes, imageDimensions } = getSettings();
	const catIds =
		categories && categories.length > 0
			? categories.map( ( cat ) => cat.id )
			: [];
	const latestPostsQuery = pickBy(
		{
			categories: catIds,
			tags,
			order,
			orderby: orderBy,
			per_page: postsToShow,
		},
		( value ) => ! isUndefined( value )
	);

	const posts = getEntityRecords( 'postType', 'post', latestPostsQuery );
	const imageSizeOptions = imageSizes
		.filter( ( { slug } ) => slug !== 'full' )
		.map( ( { name, slug } ) => ( { value: slug, label: name } ) );

	return {
		defaultImageWidth: imageDimensions[ featuredImageSizeSlug ].width,
		defaultImageHeight: imageDimensions[ featuredImageSizeSlug ].height,
		imageSizeOptions,
		latestPosts: ! Array.isArray( posts )
			? posts
			: posts.map( ( post ) => {
					if ( post.featured_media ) {
						const image = getMedia( post.featured_media );
						let url = get(
							image,
							[
								'media_details',
								'sizes',
								featuredImageSizeSlug,
								'source_url',
							],
							null
						);
						if ( ! url ) {
							url = get( image, 'source_url', null );
						}
						return { ...post, featuredImageSourceUrl: url };
					}
					return post;
			  } ),
	};
} )( LatestPostsEdit );
