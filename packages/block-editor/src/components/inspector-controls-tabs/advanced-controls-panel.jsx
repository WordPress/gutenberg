import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	default as InspectorControls,
	InspectorAdvancedControls,
} from '../inspector-controls';
import { PrivateInspectorControlsAllowedBlocks } from '../inspector-controls/groups';

/**
 * Renders the "Advanced" panel for the block inspector.
 *
 * The panel holds advanced settings tools such as the HTML anchor, from the
 * `advanced` group, alongside the private allowed-blocks control. It renders
 * nothing when neither has fills.
 *
 * @param {Object}  props               Component props.
 * @param {boolean} [props.initialOpen] Whether the panel starts expanded.
 */
const AdvancedControls = ( { initialOpen = false } ) => {
	const fills = useSlotFills( InspectorAdvancedControls.slotName );
	const privateFills = useSlotFills(
		PrivateInspectorControlsAllowedBlocks.name
	);
	const hasFills = Boolean( fills && fills.length );
	const hasPrivateFills = Boolean( privateFills && privateFills.length );

	if ( ! hasFills && ! hasPrivateFills ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__advanced"
			title={ __( 'Advanced' ) }
			initialOpen={ initialOpen }
		>
			<InspectorControls.Slot group="advanced" />
			<PrivateInspectorControlsAllowedBlocks.Slot />
		</PanelBody>
	);
};

export default AdvancedControls;
