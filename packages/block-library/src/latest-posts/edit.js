/**
 * External dependencies
 */
import { get, includes, invoke, isUndefined, pickBy } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, RawHTML, useEffect, useRef } from '@wordpress/element';
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
import { __, sprintf } from '@wordpress/i18n';
import { dateI18n, format, __experimentalGetSettings } from '@wordpress/date';
import {
	InspectorControls,
	BlockAlignmentToolbar,
	BlockControls,
	__experimentalImageSizeControl as ImageSizeControl,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { pin, list, grid } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

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
const USERS_LIST_QUERY = {
	per_page: -1,
};

export default function LatestPostsEdit( { attributes, setAttributes } ) {
	const {
		postsToShow,
		order,
		orderBy,
		categories,
		selectedAuthor,
		displayFeaturedImage,
		displayPostContentRadio,
		displayPostContent,
		displayPostDate,
		displayAuthor,
		postLayout,
		columns,
		excerptLength,
		featuredImageAlign,
		featuredImageSizeSlug,
		featuredImageSizeWidth,
		featuredImageSizeHeight,
		addLinkToFeaturedImage,
	} = attributes;
	const {
		imageSizeOptions,
		latestPosts,
		defaultImageWidth,
		defaultImageHeight,
	} = useSelect(
		( select ) => {
			const { getEntityRecords, getMedia } = select( coreStore );
			const { getSettings } = select( blockEditorStore );
			const { imageSizes, imageDimensions } = getSettings();
			const catIds =
				categories && categories.length > 0
					? categories.map( ( cat ) => cat.id )
					: [];
			const latestPostsQuery = pickBy(
				{
					categories: catIds,
					author: selectedAuthor,
					order,
					orderby: orderBy,
					per_page: postsToShow,
				},
				( value ) => ! isUndefined( value )
			);

			const posts = getEntityRecords(
				'postType',
				'post',
				latestPostsQuery
			);

			return {
				defaultImageWidth: get(
					imageDimensions,
					[ featuredImageSizeSlug, 'width' ],
					0
				),
				defaultImageHeight: get(
					imageDimensions,
					[ featuredImageSizeSlug, 'height' ],
					0
				),
				imageSizeOptions: imageSizes
					.filter( ( { slug } ) => slug !== 'full' )
					.map( ( { name, slug } ) => ( {
						value: slug,
						label: name,
					} ) ),
				latestPosts: ! Array.isArray( posts )
					? posts
					: posts.map( ( post ) => {
							if ( ! post.featured_media ) return post;

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
							const featuredImageInfo = {
								url,
								// eslint-disable-next-line camelcase
								alt: image?.alt_text,
							};
							return { ...post, featuredImageInfo };
					  } ),
			};
		},
		[
			featuredImageSizeSlug,
			postsToShow,
			order,
			orderBy,
			categories,
			selectedAuthor,
		]
	);
	const [ categoriesList, setCategoriesList ] = useState( [] );
	const [ authorList, setAuthorList ] = useState( [] );
	const categorySuggestions = categoriesList.reduce(
		( accumulator, category ) => ( {
			...accumulator,
			[ category.name ]: category,
		} ),
		{}
	);
	const selectCategories = ( tokens ) => {
		const hasNoSuggestion = tokens.some(
			( token ) =>
				typeof token === 'string' && ! categorySuggestions[ token ]
		);
		if ( hasNoSuggestion ) {
			return;
		}
		// Categories that are already will be objects, while new additions will be strings (the name).
		// allCategories nomalizes the array so that they are all objects.
		const allCategories = tokens.map( ( token ) => {
			return typeof token === 'string'
				? categorySuggestions[ token ]
				: token;
		} );
		// We do nothing if the category is not selected
		// from suggestions.
		if ( includes( allCategories, null ) ) {
			return false;
		}
		setAttributes( { categories: allCategories } );
	};

	const isStillMounted = useRef();

	useEffect( () => {
		isStillMounted.current = true;

		apiFetch( {
			path: addQueryArgs( `/wp/v2/categories`, CATEGORIES_LIST_QUERY ),
		} )
			.then( ( data ) => {
				if ( isStillMounted.current ) {
					setCategoriesList( data );
				}
			} )
			.catch( () => {
				if ( isStillMounted.current ) {
					setCategoriesList( [] );
				}
			} );
		apiFetch( {
			path: addQueryArgs( `/wp/v2/users`, USERS_LIST_QUERY ),
		} )
			.then( ( data ) => {
				if ( isStillMounted.current ) {
					setAuthorList( data );
				}
			} )
			.catch( () => {
				if ( isStillMounted.current ) {
					setAuthorList( [] );
				}
			} );

		return () => {
			isStillMounted.current = false;
		};
	}, [] );

	const hasPosts = !! latestPosts?.length;
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
					label={ __( 'Display author name' ) }
					checked={ displayAuthor }
					onChange={ ( value ) =>
						setAttributes( { displayAuthor: value } )
					}
				/>
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
						<BaseControl className="block-editor-image-alignment-control__row">
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
						<ToggleControl
							label={ __( 'Add link to featured image' ) }
							checked={ addLinkToFeaturedImage }
							onChange={ ( value ) =>
								setAttributes( {
									addLinkToFeaturedImage: value,
								} )
							}
						/>
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
					onAuthorChange={ ( value ) =>
						setAttributes( {
							selectedAuthor:
								'' !== value ? Number( value ) : undefined,
						} )
					}
					authorList={ authorList }
					selectedAuthorId={ selectedAuthor }
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

	const blockProps = useBlockProps( {
		className: classnames( {
			'wp-block-latest-posts__list': true,
			'is-grid': postLayout === 'grid',
			'has-dates': displayPostDate,
			'has-author': displayAuthor,
			[ `columns-${ columns }` ]: postLayout === 'grid',
		} ),
	} );

	if ( ! hasPosts ) {
		return (
			<div { ...blockProps }>
				{ inspectorControls }
				<Placeholder icon={ pin } label={ __( 'Latest Posts' ) }>
					{ ! Array.isArray( latestPosts ) ? (
						<Spinner />
					) : (
						__( 'No posts found.' )
					) }
				</Placeholder>
			</div>
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
		<div>
			{ inspectorControls }
			<BlockControls>
				<ToolbarGroup controls={ layoutControls } />
			</BlockControls>
			<ul { ...blockProps }>
				{ displayPosts.map( ( post, i ) => {
					const titleTrimmed = invoke( post, [
						'title',
						'rendered',
						'trim',
					] );
					let excerpt = post.excerpt.rendered;
					const currentAuthor = authorList.find(
						( author ) => author.id === post.author
					);

					const excerptElement = document.createElement( 'div' );
					excerptElement.innerHTML = excerpt;

					excerpt =
						excerptElement.textContent ||
						excerptElement.innerText ||
						'';

					const {
						featuredImageInfo: {
							url: imageSourceUrl,
							alt: featuredImageAlt,
						} = {},
					} = post;
					const imageClasses = classnames( {
						'wp-block-latest-posts__featured-image': true,
						[ `align${ featuredImageAlign }` ]: !! featuredImageAlign,
					} );
					const renderFeaturedImage =
						displayFeaturedImage && imageSourceUrl;
					const featuredImage = renderFeaturedImage && (
						<img
							src={ imageSourceUrl }
							alt={ featuredImageAlt }
							style={ {
								maxWidth: featuredImageSizeWidth,
								maxHeight: featuredImageSizeHeight,
							} }
						/>
					);

					const needsReadMore =
						excerptLength < excerpt.trim().split( ' ' ).length &&
						post.excerpt.raw === '';

					const postExcerpt = needsReadMore ? (
						<>
							{ excerpt
								.trim()
								.split( ' ', excerptLength )
								.join( ' ' ) }
							{ /* translators: excerpt truncation character, default …  */ }
							{ __( ' … ' ) }
							<a href={ post.link } rel="noopener noreferrer">
								{ __( 'Read more' ) }
							</a>
						</>
					) : (
						excerpt
					);

					return (
						<li key={ i }>
							{ renderFeaturedImage && (
								<div className={ imageClasses }>
									{ addLinkToFeaturedImage ? (
										<a
											href={ post.link }
											rel="noreferrer noopener"
										>
											{ featuredImage }
										</a>
									) : (
										featuredImage
									) }
								</div>
							) }
							<a href={ post.link } rel="noreferrer noopener">
								{ titleTrimmed ? (
									<RawHTML>{ titleTrimmed }</RawHTML>
								) : (
									__( '(no title)' )
								) }
							</a>
							{ displayAuthor && currentAuthor && (
								<div className="wp-block-latest-posts__post-author">
									{ sprintf(
										/* translators: byline. %s: current author. */
										__( 'by %s' ),
										currentAuthor.name
									) }
								</div>
							) }
							{ displayPostDate && post.date_gmt && (
								<time
									dateTime={ format( 'c', post.date_gmt ) }
									className="wp-block-latest-posts__post-date"
								>
									{ dateI18n( dateFormat, post.date_gmt ) }
								</time>
							) }
							{ displayPostContent &&
								displayPostContentRadio === 'excerpt' && (
									<div className="wp-block-latest-posts__post-excerpt">
										{ postExcerpt }
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
		</div>
	);
}
