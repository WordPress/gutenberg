/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	ToggleControl,
	TextControl,
	SelectControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useServerSideRender } from '@wordpress/server-side-render';
import { useDisabled } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';

const separatorDefaultValue = '/';

const BREADCRUMB_STYLE_OPTIONS = [
	{ label: __( 'Default' ), value: 'default' },
	{ label: __( 'Date' ), value: 'date' },
];

export default function BreadcrumbEdit( {
	attributes,
	setAttributes,
	name,
	context: { postId, postType, templateSlug },
} ) {
	const {
		separator,
		showHomeItem,
		showCurrentItem,
		breadcrumbStyle,
		showOnHomePage,
	} = attributes;
	// Handle backward compatibility for the old prefersTaxonomy attribute.
	const effectiveBreadcrumbStyle =
		breadcrumbStyle ||
		( attributes.prefersTaxonomy ? 'default' : 'default' );
	const { post, isPostTypeHierarchical, hasTermsAssigned, isLoading } =
		useSelect(
			( select ) => {
				if ( ! postType ) {
					return {};
				}
				const _post = select( coreStore ).getEntityRecord(
					'postType',
					postType,
					postId
				);
				const postTypeObject =
					select( coreStore ).getPostType( postType );
				const _postTypeHasTaxonomies =
					postTypeObject && postTypeObject.taxonomies.length;
				let taxonomies;
				if ( _postTypeHasTaxonomies ) {
					taxonomies = select( coreStore ).getTaxonomies( {
						type: postType,
						per_page: -1,
					} );
				}
				return {
					post: _post,
					isPostTypeHierarchical: postTypeObject?.hierarchical,
					hasTermsAssigned:
						_post &&
						( taxonomies || [] )
							.filter(
								( { visibility } ) =>
									visibility?.publicly_queryable
							)
							.some( ( taxonomy ) => {
								return !! _post[ taxonomy.rest_base ]?.length;
							} ),
					isLoading:
						( postId && ! _post ) ||
						! postTypeObject ||
						( _postTypeHasTaxonomies && ! taxonomies ),
				};
			},
			[ postType, postId ]
		);

	/**
	 * Counter used to cache-bust `useServerSideRender`.
	 *
	 * This is a catch-all signal to re-render the block when a post's title,
	 * parent ID, terms, or breadcrumb style change.
	 *
	 * This is fundamentally imperfect, because there are other entities which
	 * could change in the meantime (the titles of ancestor posts, or the
	 * labels of taxonomy terms), hence the choice to re-render systematically
	 * upon saving.
	 */
	const [ invalidationKey, setInvalidationKey ] = useState( 0 );
	useEffect( () => {
		setInvalidationKey( ( c ) => c + 1 );
	}, [ post, effectiveBreadcrumbStyle ] );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const { content, status, error } = useServerSideRender( {
		attributes,
		skipBlockSupportAttributes: true,
		block: name,
		urlQueryArgs: { post_id: postId, invalidationKey },
	} );
	const prevContentRef = useRef( '' );
	const prevBreadcrumbStyleRef = useRef( effectiveBreadcrumbStyle );
	useEffect( () => {
		// Clear cached content when breadcrumb style changes to prevent
		// showing stale content from a different style during the transition.
		if ( prevBreadcrumbStyleRef.current !== effectiveBreadcrumbStyle ) {
			prevBreadcrumbStyleRef.current = effectiveBreadcrumbStyle;
			prevContentRef.current = '';
		}
		if ( status === 'success' ) {
			prevContentRef.current = content;
		}
	}, [ content, status, effectiveBreadcrumbStyle ] );
	const [ showLoader, setShowLoader ] = useState( false );
	useEffect( () => {
		if ( status !== 'loading' ) {
			return;
		}
		const timeout = setTimeout( () => {
			setShowLoader( true );
		}, 400 );
		return () => {
			clearTimeout( timeout );
			setShowLoader( false );
		};
	}, [ status ] );
	const disabledRef = useDisabled();
	const blockProps = useBlockProps( { ref: disabledRef } );

	if ( isLoading ) {
		return (
			<div { ...blockProps }>
				<Spinner />
			</div>
		);
	}

	// Try to determine breadcrumb type for more accurate previews.
	let _breadcrumbStyle = effectiveBreadcrumbStyle;
	// Some non-hierarchical post types (e.g., attachments) can have parents.
	// For 'default' style, determine if we should show taxonomy or hierarchy.
	if ( effectiveBreadcrumbStyle === 'default' ) {
		if ( ! isPostTypeHierarchical && ! post?.parent ) {
			_breadcrumbStyle = 'taxonomy';
		}
	}

	let placeholder = null;
	// This is fragile because this block is server side rendered and we'll have to
	// update the placeholder html if the server side rendering output changes.
	const showPlaceholder =
		! postId ||
		! postType ||
		// When `templateSlug` is set only show placeholder if the post type is not.
		// This is needed because when we are showing the template in post editor we
		// want to show the real breadcrumbs if we have the post type.
		( templateSlug && ! postType ) ||
		( _breadcrumbStyle === 'default' &&
			! isPostTypeHierarchical &&
			! post?.parent &&
			! hasTermsAssigned ) ||
		( _breadcrumbStyle === 'taxonomy' && ! hasTermsAssigned );
	if ( showPlaceholder ) {
		const placeholderItems = [];
		if ( showHomeItem ) {
			placeholderItems.push( __( 'Home' ) );
		}
		if ( templateSlug && ! postId ) {
			placeholderItems.push( __( 'Page' ) );
		} else if ( _breadcrumbStyle === 'taxonomy' ) {
			placeholderItems.push( __( 'Category' ) );
		} else {
			placeholderItems.push( __( 'Ancestor' ), __( 'Parent' ) );
		}
		placeholder = (
			<nav
				{ ...blockProps }
				style={ {
					'--separator': `"${ separator
						.replace( /\\/g, '\\\\' )
						.replace( /"/g, '\\"' ) }"`,
					...blockProps.style,
				} }
			>
				<ol>
					{ placeholderItems.map( ( text, index ) => (
						<li key={ index }>
							<a href={ `#breadcrumbs-pseudo-link-${ index }` }>
								{ text }
							</a>
						</li>
					) ) }
					{ showCurrentItem && (
						<li>
							<span aria-current="page">{ __( 'Current' ) }</span>
						</li>
					) }
				</ol>
			</nav>
		);
	}
	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							separator: separatorDefaultValue,
							showHomeItem: true,
							showCurrentItem: true,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Show home breadcrumb' ) }
						isShownByDefault
						hasValue={ () => ! showHomeItem }
						onDeselect={ () =>
							setAttributes( {
								showHomeItem: true,
							} )
						}
					>
						<ToggleControl
							label={ __( 'Show home breadcrumb' ) }
							onChange={ ( value ) =>
								setAttributes( { showHomeItem: value } )
							}
							checked={ showHomeItem }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Show current breadcrumb' ) }
						isShownByDefault
						hasValue={ () => ! showCurrentItem }
						onDeselect={ () =>
							setAttributes( {
								showCurrentItem: true,
							} )
						}
					>
						<ToggleControl
							label={ __( 'Show current breadcrumb' ) }
							onChange={ ( value ) =>
								setAttributes( { showCurrentItem: value } )
							}
							checked={ showCurrentItem }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Separator' ) }
						isShownByDefault
						hasValue={ () => separator !== separatorDefaultValue }
						onDeselect={ () =>
							setAttributes( {
								separator: separatorDefaultValue,
							} )
						}
					>
						<TextControl
							__next40pxDefaultSize
							autoComplete="off"
							label={ __( 'Separator' ) }
							value={ separator }
							onChange={ ( value ) =>
								setAttributes( { separator: value } )
							}
							onBlur={ () => {
								if ( ! separator ) {
									setAttributes( {
										separator: separatorDefaultValue,
									} );
								}
							} }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Breadcrumb style' ) }
						isShownByDefault
						hasValue={ () =>
							breadcrumbStyle && breadcrumbStyle !== 'default'
						}
						onDeselect={ () =>
							setAttributes( { breadcrumbStyle: 'default' } )
						}
					>
						<SelectControl
							__next40pxDefaultSize
							label={ __( 'Breadcrumb style' ) }
							options={ BREADCRUMB_STYLE_OPTIONS }
							value={ effectiveBreadcrumbStyle }
							onChange={ ( value ) =>
								setAttributes( { breadcrumbStyle: value } )
							}
							help={ __(
								'Choose how to display the breadcrumb trail for single posts. "Default" shows post hierarchy for hierarchical post types, taxonomy terms for non-hierarchical post types. "Date" shows the publish date path (Year > Month > Day).'
							) }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="advanced">
				<ToggleControl
					label={ __( 'Show on homepage' ) }
					checked={ showOnHomePage }
					onChange={ ( value ) =>
						setAttributes( { showOnHomePage: value } )
					}
					help={ __(
						"If this breadcrumbs block appears in a template or template part that's shown on the homepage, enable this option to display the breadcrumb trail. Otherwise, this setting has no effect."
					) }
				/>
			</InspectorControls>
			{ status === 'loading' &&
				! showPlaceholder &&
				( prevContentRef.current ? (
					<HtmlRenderer
						wrapperProps={ {
							...blockProps,
							style: {
								...blockProps.style,
								opacity: showLoader ? 0.3 : 1,
							},
						} }
						html={ prevContentRef.current }
					/>
				) : (
					<div { ...blockProps }>
						<Spinner />
					</div>
				) ) }
			{ status === 'error' && (
				<div { ...blockProps }>
					<p>
						{ sprintf(
							/* translators: %s: error message returned when rendering the block. */
							__( 'Error: %s' ),
							error
						) }
					</p>
				</div>
			) }
			{ showPlaceholder && placeholder }
			{ ! showPlaceholder && status === 'success' && (
				<HtmlRenderer wrapperProps={ blockProps } html={ content } />
			) }
		</>
	);
}
