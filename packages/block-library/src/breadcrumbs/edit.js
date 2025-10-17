/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
import { useEffect, useState, RawHTML } from '@wordpress/element';
import { useServerSideRender } from '@wordpress/server-side-render';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const separatorDefaultValue = '/';
const typeDefaultValue = 'auto';

const BREADCRUMB_TYPES = {
	auto: {
		help: __(
			'Try to automatically determine the best type of breadcrumb for the template.'
		),
	},
	postWithAncestors: {
		help: __(
			'Shows breadcrumbs based on post hierarchy. Only works for hierarchical post types.'
		),
		placeholderItems: [ __( 'Ancestor' ), __( 'Parent' ) ],
	},
	postWithTerms: {
		help: __(
			'Shows breadcrumbs based on taxonomy terms. Chooses the first taxonomy with assigned terms and includes ancestors if the taxonomy is hierarchical.'
		),
		placeholderItems: [ __( 'Category' ) ],
	},
};

export default function BreadcrumbEdit( {
	attributes,
	setAttributes,
	context: { postId, postType, templateSlug },
} ) {
	const { separator, showHomeLink, type } = attributes;
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
				const postTypeHasTaxonomies =
					postTypeObject && postTypeObject.taxonomies.length;
				let taxonomies;
				if ( postTypeHasTaxonomies ) {
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
						! _post ||
						! postTypeObject ||
						( postTypeHasTaxonomies && ! taxonomies ),
				};
			},
			[ postType, postId ]
		);

	// Counter used to cache-bust `useServerSideRender`
	//
	// This is a catch-all signal to re-render the block when a post's title,
	// parent ID, or terms change.
	//
	// This is fundamentally imperfect, because there are other entities which
	// could change in the meantime (the titles of ancestor posts, or the
	// labels of taxonomy terms), hence the choice to re-render systematically
	// upon saving.
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
	// TODO: this should be handled better when we add more types.
	let breadcrumbsType;
	const isSpecificSupportedTypeSet = [
		'postWithAncestors',
		'postWithTerms',
	].includes( type );
	if ( isSpecificSupportedTypeSet ) {
		breadcrumbsType = type;
	} else {
		breadcrumbsType = isPostTypeHierarchical
			? 'postWithAncestors'
			: 'postWithTerms';
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
			...( templateSlug && ! isSpecificSupportedTypeSet
				? [ __( 'Page' ) ]
				: BREADCRUMB_TYPES[ breadcrumbsType ].placeholderItems ),
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
							type: typeDefaultValue,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Type' ) }
						isShownByDefault
						hasValue={ () => type !== typeDefaultValue }
						onDeselect={ () =>
							setAttributes( {
								type: typeDefaultValue,
							} )
						}
					>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Type' ) }
							value={ type }
							onChange={ ( value ) =>
								setAttributes( { type: value } )
							}
							options={ [
								{
									label: __( 'Auto' ),
									value: 'auto',
								},
								{
									label: __( 'Post with ancestors' ),
									value: 'postWithAncestors',
								},
								{
									label: __( 'Post with terms' ),
									value: 'postWithTerms',
								},
							] }
							help={ BREADCRUMB_TYPES[ type ].help }
						/>
					</ToolsPanelItem>
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
