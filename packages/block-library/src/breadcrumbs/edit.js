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

export default function BreadcrumbEdit( {
	attributes,
	setAttributes,
	context: { postId, postType },
} ) {
	const { separator, showHomeLink } = attributes;
	const isPostTypeHierarchical = useSelect(
		( select ) => {
			if ( ! postType ) {
				return null;
			}
			return select( coreStore ).getPostType( postType )?.hierarchical;
		},
		[ postType ]
	);
	const blockProps = useBlockProps();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const { content } = useServerSideRender( {
		attributes,
		skipBlockSupportAttributes: true,
		block: 'core/breadcrumbs',
		urlQueryArgs: { post_id: postId },
	} );
	let placeholder = null;
	// If no post context or the post type is not hierarchical, show placeholder.
	// This is fragile because this block is server side rendered and we'll have to
	// update the placeholder html if the server side rendering output changes.
	if ( ! postId || ! postType || ! isPostTypeHierarchical ) {
		const placeholderItems = [
			showHomeLink && __( 'Home' ),
			__( 'Ancestor' ),
			__( 'Parent' ),
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
			<div { ...blockProps }>
				{ placeholder || <RawHTML inert="true">{ content }</RawHTML> }
			</div>
		</>
	);
}
