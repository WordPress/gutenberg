/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Spinner,
	TextControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useServerSideRender } from '@wordpress/server-side-render';
import { useDisabled } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';

export default function NavigationOverlayCloseEdit( {
	attributes,
	setAttributes,
	name,
} ) {
	const { displayMode, text } = attributes;

	const { content, status, error } = useServerSideRender( {
		attributes,
		block: name,
	} );

	const disabledRef = useDisabled();
	const blockProps = useBlockProps( {
		ref: disabledRef,
		className: 'wp-block-navigation-overlay-close',
	} );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () =>
						setAttributes( { displayMode: 'icon', text: '' } )
					}
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Display Mode' ) }
						isShownByDefault
						hasValue={ () => displayMode !== 'icon' }
						onDeselect={ () =>
							setAttributes( { displayMode: 'icon' } )
						}
					>
						<ToggleGroupControl
							label={ __( 'Display Mode' ) }
							value={ displayMode }
							onChange={ ( value ) =>
								setAttributes( { displayMode: value } )
							}
							isBlock
							__next40pxDefaultSize
						>
							<ToggleGroupControlOption
								value="icon"
								label={ __( 'Icon' ) }
							/>
							<ToggleGroupControlOption
								value="text"
								label={ __( 'Text' ) }
							/>
							<ToggleGroupControlOption
								value="both"
								label={ __( 'Both' ) }
							/>
						</ToggleGroupControl>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Close Text' ) }
						isShownByDefault
						hasValue={ () => text !== '' }
						onDeselect={ () => setAttributes( { text: '' } ) }
					>
						<TextControl
							__next40pxDefaultSize
							label={ __( 'Close Text' ) }
							value={ text }
							onChange={ ( value ) =>
								setAttributes( { text: value } )
							}
							className="wp-block-navigation-overlay-close__text"
							placeholder={ __( 'Close' ) }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			{ status === 'loading' && (
				<div { ...blockProps }>
					<Spinner />
				</div>
			) }
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
			{ status === 'success' && (
				<HtmlRenderer wrapperProps={ blockProps } html={ content } />
			) }
		</>
	);
}
