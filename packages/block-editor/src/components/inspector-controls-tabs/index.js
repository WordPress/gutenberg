/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import {
	PanelBody,
	TabPanel,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import DefaultStylePicker from '../default-style-picker';
import useInspectorControlsTabs from './use-inspector-controls-tabs';
import { TAB_MENU, TAB_SETTINGS, TAB_APPEARANCE } from './utils';
import {
	default as InspectorControls,
	InspectorAdvancedControls,
} from '../inspector-controls';

export const AdvancedControls = () => {
	const fills = useSlotFills( InspectorAdvancedControls.slotName );
	const hasFills = Boolean( fills && fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__advanced"
			title={ __( 'Advanced' ) }
			initialOpen={ false }
		>
			<InspectorControls.Slot __experimentalGroup="advanced" />
		</PanelBody>
	);
};

const getMenuTab = () => <InspectorControls.Slot __experimentalGroup="menu" />;

const getSettingsTab = ( hasSingleBlockSelection = false ) => (
	<>
		<InspectorControls.Slot />
		{ hasSingleBlockSelection && (
			<div>
				<AdvancedControls />
			</div>
		) }
	</>
);

const getAppearanceTab = ( blockName, clientId, hasBlockStyles ) => {
	return (
		<>
			{ hasBlockStyles && (
				<div>
					<PanelBody title={ __( 'Styles' ) }>
						<BlockStyles clientId={ clientId } />
						{ hasBlockSupport(
							blockName,
							'defaultStylePicker',
							true
						) && <DefaultStylePicker blockName={ blockName } /> }
					</PanelBody>
				</div>
			) }
			<InspectorControls.Slot
				__experimentalGroup="color"
				label={ __( 'Color' ) }
				className="color-block-support-panel__inner-wrapper"
			/>
			<InspectorControls.Slot
				__experimentalGroup="typography"
				label={ __( 'Typography' ) }
			/>
			<InspectorControls.Slot
				__experimentalGroup="dimensions"
				label={ __( 'Dimensions' ) }
			/>
			<InspectorControls.Slot
				__experimentalGroup="border"
				label={ __( 'Border' ) }
			/>
		</>
	);
};

export default function InspectorControlsTabs( {
	blockName,
	clientId,
	hasBlockStyles,
} ) {
	const hasSingleBlockSelection = !! blockName;
	const availableTabs = useInspectorControlsTabs();

	if ( ! availableTabs.length ) {
		return null;
	}

	// If we only have a single tab to display, skip the tab panel and just
	// render the contents.
	if ( availableTabs.length === 1 ) {
		if ( availableTabs[ 0 ].name === TAB_MENU.name ) {
			return getMenuTab();
		}

		if ( availableTabs[ 0 ].name === TAB_SETTINGS.name ) {
			return getSettingsTab( hasSingleBlockSelection );
		}

		if ( availableTabs[ 0 ].name === TAB_APPEARANCE.name ) {
			return getAppearanceTab( blockName, clientId, hasBlockStyles );
		}
	}

	// We have multiple tabs with contents so render complete TabPanel.
	return (
		<TabPanel
			className="block-editor-block-inspector__tabs"
			tabs={ availableTabs }
		>
			{ ( tab ) => {
				if ( tab.name === TAB_MENU.name ) {
					return getMenuTab();
				}

				if ( tab.name === TAB_SETTINGS.name ) {
					return getSettingsTab( hasSingleBlockSelection );
				}

				if ( tab.name === TAB_APPEARANCE.name ) {
					return getAppearanceTab(
						blockName,
						clientId,
						hasBlockStyles
					);
				}
			} }
		</TabPanel>
	);
}
