import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	default as InspectorControls,
	InspectorAdvancedControls,
} from '../inspector-controls';
import groups, {
	PrivateInspectorControlsAllowedBlocks,
} from '../inspector-controls/groups';

/**
 * Renders the "Advanced" panel for the block inspector.
 *
 * Advanced controls are split across two slot groups so that each inspector tab
 * can show the tools that belong to it: `advanced` for settings tools such as
 * the HTML anchor, and `advanced-styles` for styling tools such as Additional
 * CSS. When the inspector has both a Settings and a Styles tab, each tab
 * renders its own panel. When there is no Styles tab, a single panel renders
 * both groups so that no control is dropped.
 *
 * @param {Object}  props                        Component props.
 * @param {boolean} [props.initialOpen]          Whether the panel starts expanded.
 * @param {boolean} [props.showSettingsControls] Whether to render the `advanced` group.
 * @param {boolean} [props.showStylesControls]   Whether to render the `advanced-styles` group.
 */
const AdvancedControls = ( {
	initialOpen = false,
	showSettingsControls = true,
	showStylesControls = false,
} ) => {
	const fills = useSlotFills( InspectorAdvancedControls.slotName );
	const styleFills = useSlotFills( groups[ 'advanced-styles' ].name );
	const privateFills = useSlotFills(
		PrivateInspectorControlsAllowedBlocks.name
	);
	const hasSettingsFills =
		showSettingsControls &&
		( Boolean( fills?.length ) || Boolean( privateFills?.length ) );
	const hasStyleFills = showStylesControls && Boolean( styleFills?.length );

	if ( ! hasSettingsFills && ! hasStyleFills ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__advanced"
			title={ __( 'Advanced' ) }
			initialOpen={ initialOpen }
		>
			{ showSettingsControls && (
				<InspectorControls.Slot group="advanced" />
			) }
			{ showStylesControls && (
				<InspectorControls.Slot group="advanced-styles" />
			) }
			{ showSettingsControls && (
				<PrivateInspectorControlsAllowedBlocks.Slot />
			) }
		</PanelBody>
	);
};

export default AdvancedControls;
