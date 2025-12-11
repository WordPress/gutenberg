/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
	RichText,
} from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close as closeIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function NavigationOverlayCloseEdit( {
	attributes,
	setAttributes,
} ) {
	const { displayMode, text } = attributes;
	const showIcon = displayMode === 'icon' || displayMode === 'both';
	const showText = displayMode === 'text' || displayMode === 'both';

	const blockProps = useBlockProps( {
		className: 'wp-block-navigation-overlay-close',
	} );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => setAttributes( { displayMode: 'icon' } ) }
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
							__nextHasNoMarginBottom
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
				</ToolsPanel>
			</InspectorControls>
			<Button
				{ ...blockProps }
				icon={ showIcon ? closeIcon : undefined }
				aria-label={ ! showText ? __( 'Close' ) : undefined }
				__next40pxDefaultSize
			>
				{ showText && (
					<RichText
						identifier="text"
						value={ text }
						onChange={ ( value ) =>
							setAttributes( { text: value } )
						}
						placeholder={ __( 'Close' ) }
						allowedFormats={ [ 'core/bold', 'core/italic' ] }
						withoutInteractiveFormatting
						tagName="span"
						className="wp-block-navigation-overlay-close__text"
					/>
				) }
			</Button>
		</>
	);
}
