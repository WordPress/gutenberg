/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Placeholder,
	QueryControls,
	RadioControl,
	RangeControl,
	Spinner,
	ToggleControl,
	ToolbarGroup,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { dateI18n, format, getSettings } from '@wordpress/date';
import {
	InspectorControls,
	BlockControls,
	__experimentalImageSizeControl as ImageSizeControl,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	pin,
	list,
	grid,
	alignNone,
	positionLeft,
	positionCenter,
	positionRight,
} from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticeStore } from '@wordpress/notices';
import { useInstanceId } from '@wordpress/compose';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	MIN_EXCERPT_LENGTH,
	MAX_EXCERPT_LENGTH,
	MAX_POSTS_COLUMNS,
	DEFAULT_EXCERPT_LENGTH,
} from './constants';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

/**
 * Module Constants
 */
const CATEGORIES_LIST_QUERY = {
	per_page: -1,
	_fields: 'id,name',
	context: 'view',
};
const USERS_LIST_QUERY = {
	per_page: -1,
	has_published_posts: [ 'post' ],
	context: 'view',
};
const imageAlignmentOptions = [
	{
		value: 'none',
		icon: alignNone,
		label: __( 'None' ),
	},
	{
		value: 'left',
		icon: positionLeft,
		label: __( 'Left' ),
	},
	{
		value: 'center',
		icon: positionCenter,
		label: __( 'Center' ),
	},
	{
		value: 'right',
		icon: positionRight,
		label: __( 'Right' ),
	},
];

function getFeaturedImageDetails( post, size ) {
	const image = post._embedded?.[ 'wp:featuredmedia' ]?.[ '0' ];

	return {
		url:
			image?.media_details?.sizes?.[ size ]?.source_url ??
			image?.source_url,
		alt: image?.alt_text,
	};
}

function getCurrentAuthor( post ) {
	return post._embedded?.author?.[ 0 ];
}

function Controls( { attributes, setAttributes, postCount } ) {
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
		imageSizes,
		defaultImageWidth,
		defaultImageHeight,
		categoriesList,
		authorList,
	} = useSelect(
		( select ) => {
			const { getEntityRecords, getUsers } = select( coreStore );
			const settings = select( blockEditorStore ).getSettings();

			return {
				defaultImageWidth:
					settings.imageDimensions?.[ featuredImageSizeSlug ]
						?.width ?? 0,
				defaultImageHeight:
					settings.imageDimensions?.[ featuredImageSizeSlug ]
						?.height ?? 0,
				imageSizes: settings.imageSizes,
				categoriesList: getEntityRecords(
					'taxonomy',
					'category',
					CATEGORIES_LIST_QUERY
				),
				authorList: getUsers( USERS_LIST_QUERY ),
			};
		},
		[ featuredImageSizeSlug ]
	);

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const imageSizeOptions = imageSizes
		.filter( ( { slug } ) => slug !== 'full' )
		.map( ( { name, slug } ) => ( {
			value: slug,
			label: name,
		} ) );
	const categorySuggestions =
		categoriesList?.reduce(
			( accumulator, category ) => ( {
				...accumulator,
				[ category.name ]: category,
			} ),
			{}
		) ?? {};
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
		if ( allCategories.includes( null ) ) {
			return false;
		}
		setAttributes( { categories: allCategories } );
	};

	return (
		<>
			<ToolsPanel
				label={ __( 'Post content' ) }
				resetAll={ () =>
					setAttributes( {
						displayPostContent: false,
						displayPostContentRadio: 'excerpt',
						excerptLength: DEFAULT_EXCERPT_LENGTH,
					} )
				}
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					hasValue={ () => !! displayPostContent }
					label={ __( 'Display post content' ) }
					onDeselect={ () =>
						setAttributes( { displayPostContent: false } )
					}
					isShownByDefault
				>
					<ToggleControl
						label={ __( 'Display post content' ) }
						checked={ displayPostContent }
						onChange={ ( value ) =>
							setAttributes( { displayPostContent: value } )
						}
					/>
				</ToolsPanelItem>
				{ displayPostContent && (
					<ToolsPanelItem
						hasValue={ () => displayPostContentRadio !== 'excerpt' }
						label={ __( 'Content length' ) }
						onDeselect={ () =>
							setAttributes( {
								displayPostContentRadio: 'excerpt',
							} )
						}
						isShownByDefault
					>
						<RadioControl
							label={ __( 'Content length' ) }
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
					</ToolsPanelItem>
				) }
				{ displayPostContent &&
					displayPostContentRadio === 'excerpt' && (
						<ToolsPanelItem
							hasValue={ () =>
								excerptLength !== DEFAULT_EXCERPT_LENGTH
							}
							label={ __( 'Max number of words' ) }
							onDeselect={ () =>
								setAttributes( {
									excerptLength: DEFAULT_EXCERPT_LENGTH,
								} )
							}
							isShownByDefault
						>
							<RangeControl
								__next40pxDefaultSize
								label={ __( 'Max number of words' ) }
								value={ excerptLength }
								onChange={ ( value ) =>
									setAttributes( { excerptLength: value } )
								}
								min={ MIN_EXCERPT_LENGTH }
								max={ MAX_EXCERPT_LENGTH }
							/>
						</ToolsPanelItem>
					) }
			</ToolsPanel>
			<ToolsPanel
				label={ __( 'Post meta' ) }
				resetAll={ () =>
					setAttributes( {
						displayAuthor: false,
						displayPostDate: false,
					} )
				}
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					hasValue={ () => !! displayAuthor }
					label={ __( 'Display author name' ) }
					onDeselect={ () =>
						setAttributes( { displayAuthor: false } )
					}
					isShownByDefault
				>
					<ToggleControl
						label={ __( 'Display author name' ) }
						checked={ displayAuthor }
						onChange={ ( value ) =>
							setAttributes( { displayAuthor: value } )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={ () => !! displayPostDate }
					label={ __( 'Display post date' ) }
					onDeselect={ () =>
						setAttributes( { displayPostDate: false } )
					}
					isShownByDefault
				>
					<ToggleControl
						label={ __( 'Display post date' ) }
						checked={ displayPostDate }
						onChange={ ( value ) =>
							setAttributes( { displayPostDate: value } )
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
			<ToolsPanel
				label={ __( 'Featured image' ) }
				resetAll={ () =>
					setAttributes( {
						displayFeaturedImage: false,
						featuredImageAlign: undefined,
						featuredImageSizeSlug: 'thumbnail',
						featuredImageSizeWidth: null,
						featuredImageSizeHeight: null,
						addLinkToFeaturedImage: false,
					} )
				}
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					hasValue={ () => !! displayFeaturedImage }
					label={ __( 'Display featured image' ) }
					onDeselect={ () =>
						setAttributes( { displayFeaturedImage: false } )
					}
					isShownByDefault
				>
					<ToggleControl
						label={ __( 'Display featured image' ) }
						checked={ displayFeaturedImage }
						onChange={ ( value ) =>
							setAttributes( { displayFeaturedImage: value } )
						}
					/>
				</ToolsPanelItem>
				{ displayFeaturedImage && (
					<>
						<ToolsPanelItem
							hasValue={ () =>
								featuredImageSizeSlug !== 'thumbnail' ||
								featuredImageSizeWidth !== null ||
								featuredImageSizeHeight !== null
							}
							label={ __( 'Image size' ) }
							onDeselect={ () =>
								setAttributes( {
									featuredImageSizeSlug: 'thumbnail',
									featuredImageSizeWidth: null,
									featuredImageSizeHeight: null,
								} )
							}
							isShownByDefault
						>
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
								imageSizeHelp={ __(
									'Select the size of the source image.'
								) }
								onChangeImage={ ( value ) =>
									setAttributes( {
										featuredImageSizeSlug: value,
										featuredImageSizeWidth: undefined,
										featuredImageSizeHeight: undefined,
									} )
								}
							/>
						</ToolsPanelItem>
						<ToolsPanelItem
							hasValue={ () => !! featuredImageAlign }
							label={ __( 'Image alignment' ) }
							onDeselect={ () =>
								setAttributes( {
									featuredImageAlign: undefined,
								} )
							}
							isShownByDefault
						>
							<ToggleGroupControl
								className="editor-latest-posts-image-alignment-control"
								__next40pxDefaultSize
								label={ __( 'Image alignment' ) }
								value={ featuredImageAlign || 'none' }
								onChange={ ( value ) =>
									setAttributes( {
										featuredImageAlign:
											value !== 'none'
												? value
												: undefined,
									} )
								}
							>
								{ imageAlignmentOptions.map(
									( { value, icon, label } ) => {
										return (
											<ToggleGroupControlOptionIcon
												key={ value }
												value={ value }
												icon={ icon }
												label={ label }
											/>
										);
									}
								) }
							</ToggleGroupControl>
						</ToolsPanelItem>
						<ToolsPanelItem
							hasValue={ () => !! addLinkToFeaturedImage }
							label={ __( 'Add link to featured image' ) }
							onDeselect={ () =>
								setAttributes( {
									addLinkToFeaturedImage: false,
								} )
							}
							isShownByDefault
						>
							<ToggleControl
								label={ __( 'Add link to featured image' ) }
								checked={ addLinkToFeaturedImage }
								onChange={ ( value ) =>
									setAttributes( {
										addLinkToFeaturedImage: value,
									} )
								}
							/>
						</ToolsPanelItem>
					</>
				) }
			</ToolsPanel>

			<ToolsPanel
				label={ __( 'Sorting and filtering' ) }
				resetAll={ () =>
					setAttributes( {
						order: 'desc',
						orderBy: 'date',
						postsToShow: 5,
						categories: undefined,
						selectedAuthor: undefined,
						columns: 3,
					} )
				}
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					hasValue={ () =>
						order !== 'desc' ||
						orderBy !== 'date' ||
						postsToShow !== 5 ||
						categories?.length > 0 ||
						!! selectedAuthor
					}
					label={ __( 'Sort and filter' ) }
					onDeselect={ () =>
						setAttributes( {
							order: 'desc',
							orderBy: 'date',
							postsToShow: 5,
							categories: undefined,
							selectedAuthor: undefined,
						} )
					}
					isShownByDefault
				>
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
						authorList={ authorList ?? [] }
						selectedAuthorId={ selectedAuthor }
					/>
				</ToolsPanelItem>

				{ postLayout === 'grid' && (
					<ToolsPanelItem
						hasValue={ () => columns !== 3 }
						label={ __( 'Columns' ) }
						onDeselect={ () =>
							setAttributes( {
								columns: 3,
							} )
						}
						isShownByDefault
					>
						<RangeControl
							__next40pxDefaultSize
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ ( value ) =>
								setAttributes( { columns: value } )
							}
							min={ 2 }
							max={
								! postCount
									? MAX_POSTS_COLUMNS
									: Math.min( MAX_POSTS_COLUMNS, postCount )
							}
							required
						/>
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</>
	);
}

export default function LatestPostsEdit( { attributes, setAttributes } ) {
	const instanceId = useInstanceId( LatestPostsEdit );

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
	const { latestPosts } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			const catIds =
				categories && categories.length > 0
					? categories.map( ( cat ) => cat.id )
					: [];
			const latestPostsQuery = Object.fromEntries(
				Object.entries( {
					categories: catIds,
					author: selectedAuthor,
					order,
					orderby: orderBy,
					per_page: postsToShow,
					_embed: 'author,wp:featuredmedia',
					ignore_sticky: true,
				} ).filter( ( [ , value ] ) => typeof value !== 'undefined' )
			);

			return {
				latestPosts: getEntityRecords(
					'postType',
					'post',
					latestPostsQuery
				),
			};
		},
		[ postsToShow, order, orderBy, categories, selectedAuthor ]
	);

	// If a user clicks to a link prevent redirection and show a warning.
	const { createWarningNotice } = useDispatch( noticeStore );
	const showRedirectionPreventedNotice = ( event ) => {
		event.preventDefault();
		createWarningNotice( __( 'Links are disabled in the editor.' ), {
			id: `block-library/core/latest-posts/redirection-prevented/${ instanceId }`,
			type: 'snackbar',
		} );
	};

	const hasPosts = !! latestPosts?.length;
	const inspectorControls = (
		<InspectorControls>
			<Controls
				attributes={ attributes }
				setAttributes={ setAttributes }
				postCount={ latestPosts?.length ?? 0 }
			/>
		</InspectorControls>
	);

	const blockProps = useBlockProps( {
		className: clsx( {
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
			title: _x( 'List view', 'Latest posts block display setting' ),
			onClick: () => setAttributes( { postLayout: 'list' } ),
			isActive: postLayout === 'list',
		},
		{
			icon: grid,
			title: _x( 'Grid view', 'Latest posts block display setting' ),
			onClick: () => setAttributes( { postLayout: 'grid' } ),
			isActive: postLayout === 'grid',
		},
	];

	const dateFormat = getSettings().formats.date;

	return (
		<>
			{ inspectorControls }
			<BlockControls>
				<ToolbarGroup controls={ layoutControls } />
			</BlockControls>
			<ul { ...blockProps }>
				{ displayPosts.map( ( post ) => {
					const titleTrimmed = post.title.rendered.trim();
					let excerpt = post.excerpt.rendered;
					const currentAuthor = getCurrentAuthor( post );

					const excerptElement = document.createElement( 'div' );
					excerptElement.innerHTML = excerpt;

					excerpt =
						excerptElement.textContent ||
						excerptElement.innerText ||
						'';

					const { url: imageSourceUrl, alt: featuredImageAlt } =
						getFeaturedImageDetails( post, featuredImageSizeSlug );
					const imageClasses = clsx( {
						'wp-block-latest-posts__featured-image': true,
						[ `align${ featuredImageAlign }` ]:
							!! featuredImageAlign,
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
							{ createInterpolateElement(
								sprintf(
									/* translators: 1: Hidden accessibility text: Post title */
									__(
										'… <a>Read more<span>: %1$s</span></a>'
									),
									titleTrimmed || __( '(no title)' )
								),
								{
									a: (
										// eslint-disable-next-line jsx-a11y/anchor-has-content
										<a
											className="wp-block-latest-posts__read-more"
											href={ post.link }
											rel="noopener noreferrer"
											onClick={
												showRedirectionPreventedNotice
											}
										/>
									),
									span: (
										<span className="screen-reader-text" />
									),
								}
							) }
						</>
					) : (
						excerpt
					);

					return (
						<li key={ post.id }>
							{ renderFeaturedImage && (
								<div className={ imageClasses }>
									{ addLinkToFeaturedImage ? (
										<a
											href={ post.link }
											onClick={
												showRedirectionPreventedNotice
											}
										>
											{ featuredImage }
										</a>
									) : (
										featuredImage
									) }
								</div>
							) }
							<a
								className="wp-block-latest-posts__post-title"
								href={ post.link }
								dangerouslySetInnerHTML={
									!! titleTrimmed
										? {
												__html: titleTrimmed,
										  }
										: undefined
								}
								onClick={ showRedirectionPreventedNotice }
							>
								{ ! titleTrimmed ? __( '(no title)' ) : null }
							</a>
							{ displayAuthor && currentAuthor && (
								<div className="wp-block-latest-posts__post-author">
									{ sprintf(
										/* translators: byline. %s: author. */
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
									<div
										className="wp-block-latest-posts__post-full-content"
										dangerouslySetInnerHTML={ {
											__html: post.content.raw.trim(),
										} }
									/>
								) }
						</li>
					);
				} ) }
			</ul>
		</>
	);
}
