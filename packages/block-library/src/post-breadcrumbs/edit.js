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

export default function PostBreadcrumbEdit( {
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
		block: 'core/post-breadcrumbs',
		urlQueryArgs: { post_id: postId },
	} );

	// If no post context, show placeholder.
	if ( ! postId || ! postType ) {
		return <div { ...blockProps }>{ __( 'Post Breadcrumb.' ) }</div>;
	}

	// If post type is not hierarchical, show message.
	if ( postTypeObject && ! postTypeObject.hierarchical ) {
		return (
			<div { ...blockProps }>
				{ __( 'Post Breadcrumb: Non-hierarchical post type.' ) }
			</div>
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
				<RawHTML>{ content }</RawHTML>
			</div>
		</>
	);
}
