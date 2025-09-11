/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as InspectorControls } from '../inspector-controls';
import PositionControls from '../inspector-controls-tabs/position-controls-panel';
import AdvancedControls from '../inspector-controls-tabs/advanced-controls-panel';
import { useBorderPanelLabel } from '../../hooks/border';

/**
 * Renders the standard style-related inspector control slots.
 * This component consolidates the duplicated slot patterns used throughout
 * the block inspector for consistent styling controls.
 *
 * @param {Object}  props                      - Component props.
 * @param {string}  props.blockName            - Name of the block to determine border panel label.
 * @param {boolean} props.showAdvancedControls - Whether to show advanced controls.
 * @param {boolean} props.showPositionControls - Whether to show position controls.
 * @param {boolean} props.showListControls     - Whether to show list controls.
 * @param {boolean} props.showBindingsControls - Whether to show bindings controls.
 * @param {string}  props.className            - Additional CSS class for the color panel wrapper.
 */
export default function StyleInspectorSlots( {
	blockName,
	showAdvancedControls = true,
	showPositionControls = true,
	showListControls = false,
	showBindingsControls = true,
	className,
} ) {
	const borderPanelLabel = useBorderPanelLabel( { blockName } );
	return (
		<>
			<InspectorControls.Slot />
			{ showListControls && <InspectorControls.Slot group="list" /> }
			<InspectorControls.Slot
				group="color"
				label={ __( 'Color' ) }
				className={
					className || 'color-block-support-panel__inner-wrapper'
				}
			/>
			<InspectorControls.Slot
				group="background"
				label={ __( 'Background image' ) }
			/>
			<InspectorControls.Slot
				group="typography"
				label={ __( 'Typography' ) }
			/>
			<InspectorControls.Slot
				group="dimensions"
				label={ __( 'Dimensions' ) }
			/>
			<InspectorControls.Slot group="border" label={ borderPanelLabel } />
			<InspectorControls.Slot group="styles" />
			{ showPositionControls && <PositionControls /> }
			{ showBindingsControls && (
				<InspectorControls.Slot group="bindings" />
			) }
			{ showAdvancedControls && (
				<div>
					<AdvancedControls />
				</div>
			) }
		</>
	);
}
