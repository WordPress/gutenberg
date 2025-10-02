/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	ToggleControl,
	TextControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { RawHTML } from '@wordpress/element';
import { useServerSideRender } from '@wordpress/server-side-render';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
const separatorDefaultValue = '/';

export default function PostBreadcrumbEdit( {
	attributes,
	setAttributes,
	context: { postId, postType },
} ) {
	const { type, separator, showHomeLink } = attributes;
	const { isHierarchical, hasTermsAssigned } = useSelect(
		( select ) => {
			if ( ! postType ) {
				return null;
			}
			const postTypeObject = select( coreStore ).getPostType( postType );
			const post = select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			);
			const taxonomies = select( coreStore ).getTaxonomies( {
				type: postType,
				per_page: -1,
			} );
			return {
				isHierarchical: postTypeObject?.hierarchical,
				hasTermsAssigned:
					post &&
					( taxonomies || [] )
						.filter(
							( { visibility } ) => visibility?.publicly_queryable
						)
						.some( ( taxonomy ) => {
							return !! post[ taxonomy.rest_base ]?.length;
						} ),
			};
		},
		[ postType, postId ]
	);
	const blockProps = useBlockProps();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const { content } = useServerSideRender( {
		attributes,
		skipBlockSupportAttributes: true,
		block: 'core/post-breadcrumbs',
		urlQueryArgs: { post_id: postId },
	} );
	let placeholder = null;
	// If no post context, show placeholder.
	// This is fragile because this block is server side rendered and we'll have to
	// update the placeholder html if the server side rendering output changes.
	if (
		! postId ||
		! postType ||
		( type === 'hierarchical' && ! isHierarchical ) ||
		( type === 'terms' && ! hasTermsAssigned )
	) {
		let placeholderItems =
			type === 'terms'
				? [ __( 'Category' ) ]
				: [ __( 'Ancestor' ), __( 'Parent' ) ];
		placeholderItems = [
			showHomeLink && __( 'Home' ),
			...placeholderItems,
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
							<a
								href={ `#post-breadcrumbs-pseudo-link-${ index }` }
							>
								{ text }
							</a>
						</li>
					) ) }
					<li>
						<span>{ __( 'Current' ) }</span>
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
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>
				{ placeholder || <RawHTML inert="true">{ content }</RawHTML> }
			</div>
		</>
	);
}
