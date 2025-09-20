/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import ServerSideRender from '@wordpress/server-side-render';

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
	const { separator } = attributes;

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
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Make title a link' ) }
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
				<ServerSideRender
					block="core/post-breadcrumb"
					attributes={ attributes }
					context={ { postId, postType } }
				/>
			</div>
		</>
	);
}
