/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	ToggleControl,
	TextControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useState, RawHTML } from '@wordpress/element';
import { useServerSideRender } from '@wordpress/server-side-render';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const separatorDefaultValue = '/';
const postBreadcrumbsTypeDefaultValue = 'postWithAncestors';

const BREADCRUMB_TYPES = {
	postWithAncestors: {
		placeholderItems: [ __( 'Ancestor' ), __( 'Parent' ) ],
	},
	postWithTerms: {
		placeholderItems: [ __( 'Category' ) ],
	},
};

export default function BreadcrumbEdit( {
	attributes,
	setAttributes,
	context: { postId, postType, templateSlug },
} ) {
	const { separator, showHomeLink, postBreadcrumbsType } = attributes;
	const {
		post,
		isPostTypeHierarchical,
		postTypeHasTaxonomies,
		hasTermsAssigned,
		isLoading,
	} = useSelect(
		( select ) => {
			if ( ! postType ) {
				return {};
			}
			const _post = select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			);
			const postTypeObject = select( coreStore ).getPostType( postType );
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
				postTypeHasTaxonomies: _postTypeHasTaxonomies,
				hasTermsAssigned:
					_post &&
					( taxonomies || [] )
						.filter(
							( { visibility } ) => visibility?.publicly_queryable
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
	 * parent ID, or terms change.
	 *
	 * This is fundamentally imperfect, because there are other entities which
	 * could change in the meantime (the titles of ancestor posts, or the
	 * labels of taxonomy terms), hence the choice to re-render systematically
	 * upon saving.
	 */
	const [ invalidationKey, setInvalidationKey ] = useState( 0 );
	useEffect( () => {
		setInvalidationKey( ( c ) => c + 1 );
	}, [ post ] );

	const blockProps = useBlockProps();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const { content } = useServerSideRender( {
		attributes,
		skipBlockSupportAttributes: true,
		block: 'core/breadcrumbs',
		urlQueryArgs: { post_id: postId, invalidationKey },
	} );

	if ( isLoading ) {
		return (
			<div { ...blockProps }>
				<Spinner />
			</div>
		);
	}

	// Determine breadcrumb type for accurate previews (matching PHP logic).
	let breadcrumbsType;
	if ( ! isPostTypeHierarchical ) {
		breadcrumbsType = 'postWithTerms';
	} else if ( ! postTypeHasTaxonomies ) {
		// Hierarchical post type without taxonomies can only use ancestors.
		breadcrumbsType = 'postWithAncestors';
	} else {
		// For hierarchical post types with taxonomies, use the attribute if valid.
		const supportedTypes = [ 'postWithAncestors', 'postWithTerms' ];
		breadcrumbsType = supportedTypes.includes( postBreadcrumbsType )
			? postBreadcrumbsType
			: 'postWithAncestors';
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
		( breadcrumbsType === 'postWithAncestors' &&
			! isPostTypeHierarchical ) ||
		( breadcrumbsType === 'postWithTerms' && ! hasTermsAssigned );
	if ( showPlaceholder ) {
		const placeholderItems = [
			showHomeLink && __( 'Home' ),
			// For now if we are adding this in a template show a generic placeholder.
			...( templateSlug && ! postId
				? [ __( 'Page' ) ]
				: BREADCRUMB_TYPES[ breadcrumbsType ]?.placeholderItems || [] ),
		].filter( Boolean );
		placeholder = (
			<nav
				style={ {
					'--separator': `'${ separator }'`,
				} }
				inert="true"
			>
				<ol>
					{ placeholderItems.map( ( text, index ) => (
						<li key={ index }>
							<a href={ `#breadcrumbs-pseudo-link-${ index }` }>
								{ text }
							</a>
						</li>
					) ) }
					<li>
						<span aria-current="page">{ __( 'Current' ) }</span>
					</li>
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
							showHomeLink: true,
							postBreadcrumbsType:
								postBreadcrumbsTypeDefaultValue,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Show home link' ) }
						isShownByDefault
						hasValue={ () => ! showHomeLink }
						onDeselect={ () =>
							setAttributes( {
								showHomeLink: true,
							} )
						}
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show home link' ) }
							onChange={ ( value ) =>
								setAttributes( { showHomeLink: value } )
							}
							checked={ showHomeLink }
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
							__nextHasNoMarginBottom
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
						label={ __( 'Post breadcrumbs type' ) }
						hasValue={ () =>
							postBreadcrumbsType !==
							postBreadcrumbsTypeDefaultValue
						}
						onDeselect={ () =>
							setAttributes( {
								postBreadcrumbsType:
									postBreadcrumbsTypeDefaultValue,
							} )
						}
						isShownByDefault
					>
						<ToggleGroupControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							isBlock
							label={ __( 'Type' ) }
							value={ postBreadcrumbsType }
							onChange={ ( value ) =>
								setAttributes( { postBreadcrumbsType: value } )
							}
							help={ __(
								'For hierarchical post types with taxonomies, the breadcrumbs trail can consist of either the post ancestors or its assigned terms.'
							) }
						>
							<ToggleGroupControlOption
								value="postWithAncestors"
								label={ __( 'With ancestors' ) }
							/>
							<ToggleGroupControlOption
								value="postWithTerms"
								label={ __( 'With terms' ) }
							/>
						</ToggleGroupControl>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>
				{ showPlaceholder ? (
					placeholder
				) : (
					<RawHTML inert="true">{ content }</RawHTML>
				) }
			</div>
		</>
	);
}
