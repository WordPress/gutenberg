/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
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

const separatorOptions = [ '/', '>', '|' ];
const defaultValue = '/';

export default function BreadcrumbEdit( {
	attributes,
	setAttributes,
	context: { postId, postType },
} ) {
	const { separator, showHomeLink } = attributes;
	const postTypeObject = useSelect(
		( select ) => {
			if ( ! postType ) {
				return null;
			}
			return select( coreStore ).getPostType( postType );
		},
		[ postType ]
	);
	const blockProps = useBlockProps();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const { content } = useServerSideRender( {
		attributes,
		block: 'core/breadcrumbs',
		urlQueryArgs: { post_id: postId },
	} );
	let placeholder = null;
	// If no post context or the post type is not hierarchical, show placeholder.
	// This is fragile because this block is server side rendered and we'll have to
	// update the placeholder html if the server side rendering output changes.
	if ( ! postId || ! postType || ! postTypeObject?.hierarchical ) {
		const placeholderItems = [
			showHomeLink && __( 'Home' ),
			__( 'Ancestor' ),
			__( 'Parent' ),
		].filter( Boolean );
		placeholder = (
			<nav
				style={ {
					...blockProps.style,
					'--separator': `'${ separator }'`,
				} }
			>
				<ol>
					{ placeholderItems.map( ( text, index ) => (
						<li key={ index }>
							<a
								href={ `#${ text.toLowerCase() }` }
								onClick={ ( event ) => event.preventDefault() }
							>
								{ text }
							</a>
						</li>
					) ) }
					<li>
						<span>{ __( 'Page' ) }</span>
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
							separator: defaultValue,
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
						hasValue={ () => separator !== defaultValue }
						onDeselect={ () =>
							setAttributes( {
								separator: defaultValue,
							} )
						}
					>
						<ToggleGroupControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Separator' ) }
							value={ separator }
							onChange={ ( value ) =>
								setAttributes( { separator: value } )
							}
							isBlock
						>
							{ separatorOptions.map( ( option ) => (
								<ToggleGroupControlOption
									key={ option }
									value={ option }
									label={ option }
								/>
							) ) }
						</ToggleGroupControl>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>
				{ placeholder || <RawHTML>{ content }</RawHTML> }
			</div>
		</>
	);
}
