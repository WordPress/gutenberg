/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	ToggleControl,
	TextControl,
	CheckboxControl,
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

export default function BreadcrumbEdit( {
	attributes,
	setAttributes,
	context: { postId, postType, templateSlug },
} ) {
	const { separator, showHomeLink, prefersTaxonomy } = attributes;
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
	let _showTerms;
	if ( ! isPostTypeHierarchical ) {
		_showTerms = true;
	} else if ( ! postTypeHasTaxonomies ) {
		// Hierarchical post type without taxonomies can only use ancestors.
		_showTerms = false;
	} else {
		// For hierarchical post types with taxonomies, use the attribute.
		_showTerms = prefersTaxonomy;
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
		( ! _showTerms && ! isPostTypeHierarchical ) ||
		( _showTerms && ! hasTermsAssigned );
	if ( showPlaceholder ) {
		const placeholderItems = [];
		if ( showHomeLink ) {
			placeholderItems.push( __( 'Home' ) );
		}
		if ( templateSlug && ! postId ) {
			placeholderItems.push( __( 'Page' ) );
		} else if ( _showTerms ) {
			placeholderItems.push( __( 'Category' ) );
		} else {
			placeholderItems.push( __( 'Ancestor' ), __( 'Parent' ) );
		}
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
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="advanced">
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ __( 'Prefer taxonomy terms' ) }
					checked={ prefersTaxonomy }
					onChange={ ( value ) =>
						setAttributes( { prefersTaxonomy: value } )
					}
					help={ __(
						'The exact type of breadcrumbs shown will vary automatically depending on the page in which this block is displayed. In the specific case of a hierarchical post type with taxonomies, the breadcrumbs can either reflect its post hierarchy (default) or the hierarchy of its assigned taxonomy terms.'
					) }
				/>
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
