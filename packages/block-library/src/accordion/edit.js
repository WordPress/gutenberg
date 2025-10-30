/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockControls,
	useBlockEditingMode,
	store as blockEditorStore,
	HeadingLevelDropdown,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const ACCORDION_BLOCK_NAME = 'core/accordion-item';
const ACCORDION_HEADING_BLOCK_NAME = 'core/accordion-heading';
const ACCORDION_BLOCK = {
	name: ACCORDION_BLOCK_NAME,
};

export default function Edit( {
	attributes: {
		autoclose,
		iconPosition,
		showIcon,
		headingLevel,
		levelOptions,
	},
	clientId,
	setAttributes,
	isSelected: isSingleSelected,
} ) {
	const registry = useRegistry();
	const { getBlockOrder } = useSelect( blockEditorStore );
	const blockProps = useBlockProps( {
		role: 'group',
	} );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const { updateBlockAttributes, insertBlock } =
		useDispatch( blockEditorStore );
	const blockEditingMode = useBlockEditingMode();
	const isContentOnlyMode = blockEditingMode === 'contentOnly';

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: [ [ ACCORDION_BLOCK_NAME ] ],
		defaultBlock: ACCORDION_BLOCK,
		directInsert: true,
		templateInsertUpdatesSelection: true,
	} );

	const addAccordionItemBlock = () => {
		// When adding, set the header's level to current headingLevel
		const newAccordionItem = createBlock( ACCORDION_BLOCK_NAME, {}, [
			createBlock( ACCORDION_HEADING_BLOCK_NAME, {
				level: headingLevel,
			} ),
			createBlock( 'core/accordion-panel', {} ),
		] );
		insertBlock( newAccordionItem, undefined, clientId );
	};

	/**
	 * Update all child Accordion Header blocks with a new heading level
	 * based on the accordion group setting.
	 * @param {number} newHeadingLevel The new heading level to set
	 */
	const updateHeadingLevel = ( newHeadingLevel ) => {
		const innerBlockClientIds = getBlockOrder( clientId );

		// Get all accordion-header blocks from all accordion-content blocks.
		const accordionHeaderClientIds = [];
		innerBlockClientIds.forEach( ( contentClientId ) => {
			const headerClientIds = getBlockOrder( contentClientId );
			accordionHeaderClientIds.push( ...headerClientIds );
		} );

		// Update own and child block heading levels.
		registry.batch( () => {
			setAttributes( { headingLevel: newHeadingLevel } );
			updateBlockAttributes( accordionHeaderClientIds, {
				level: newHeadingLevel,
			} );
		} );
	};

	return (
		<>
			{ isSingleSelected && ! isContentOnlyMode && (
				<>
					<BlockControls>
						<ToolbarGroup>
							<HeadingLevelDropdown
								value={ headingLevel }
								options={ levelOptions }
								onChange={ updateHeadingLevel }
							/>
						</ToolbarGroup>
					</BlockControls>
					<BlockControls group="other">
						<ToolbarButton onClick={ addAccordionItemBlock }>
							{ __( 'Add' ) }
						</ToolbarButton>
					</BlockControls>
				</>
			) }
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
									iconPosition: value
										? iconPosition
										: 'right',
								} );
							} }
							checked={ showIcon }
							help={ __(
								'Display a plus icon next to the accordion header.'
							) }
						/>
					</ToolsPanelItem>
					{ showIcon && (
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
					) }
				</ToolsPanel>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
