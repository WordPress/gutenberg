/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToolbarButton,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const ACCORDION_BLOCK_NAME = 'core/accordion-content';
const ACCORDION_BLOCK = {
	name: ACCORDION_BLOCK_NAME,
};

export default function Edit( {
	attributes: { autoclose, iconPosition, showIcon },
	clientId,
	setAttributes,
} ) {
	const blockProps = useBlockProps();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const { insertBlock } = useDispatch( blockEditorStore );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: [ [ ACCORDION_BLOCK_NAME ], [ ACCORDION_BLOCK_NAME ] ],
		defaultBlock: ACCORDION_BLOCK,
		directInsert: true,
		templateInsertUpdatesSelection: true,
	} );

	const addAccordionContentBlock = () => {
		const newAccordionContent = createBlock( ACCORDION_BLOCK_NAME );
		insertBlock( newAccordionContent, undefined, clientId );
	};

	return (
		<>
			<BlockControls group="other">
				<ToolbarButton
					label={ __( 'Add accordion content block' ) }
					onClick={ addAccordionContentBlock }
				>
					{ __( 'Add' ) }
				</ToolbarButton>
			</BlockControls>
			<InspectorControls key="setting">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							autoclose: false,
							showIcon: true,
							iconPosition: 'right',
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Auto-close' ) }
						isShownByDefault
						hasValue={ () => !! autoclose }
						onDeselect={ () =>
							setAttributes( { autoclose: false } )
						}
					>
						<ToggleControl
							isBlock
							__nextHasNoMarginBottom
							label={ __( 'Auto-close' ) }
							onChange={ ( value ) => {
								setAttributes( {
									autoclose: value,
								} );
							} }
							checked={ autoclose }
							help={ __(
								'Automatically close accordions when a new one is opened.'
							) }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Show icon' ) }
						isShownByDefault
						hasValue={ () => ! showIcon }
						onDeselect={ () => setAttributes( { showIcon: true } ) }
					>
						<ToggleControl
							isBlock
							__nextHasNoMarginBottom
							label={ __( 'Show icon' ) }
							onChange={ ( value ) => {
								setAttributes( {
									showIcon: value,
								} );
							} }
							checked={ showIcon }
							help={ __(
								'Display a plus icon next to the accordion header.'
							) }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Icon Position' ) }
						isShownByDefault
						hasValue={ () => iconPosition !== 'right' }
						onDeselect={ () =>
							setAttributes( { iconPosition: 'right' } )
						}
					>
						<ToggleGroupControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							isBlock
							label={ __( 'Icon Position' ) }
							value={ iconPosition }
							onChange={ ( value ) => {
								setAttributes( { iconPosition: value } );
							} }
						>
							<ToggleGroupControlOption
								label={ __( 'Left' ) }
								value="left"
							/>
							<ToggleGroupControlOption
								label={ __( 'Right' ) }
								value="right"
							/>
						</ToggleGroupControl>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
