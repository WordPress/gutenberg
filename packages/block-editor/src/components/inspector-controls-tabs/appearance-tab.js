/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import DefaultStylePicker from '../default-style-picker';
import InspectorControls from '../inspector-controls';
import InspectorControlsGroups from '../inspector-controls/groups';

const AppearanceTab = ( {
	blockName,
	clientId,
	hasBlockStyles,
	hasSingleBlockSelection = false,
} ) => {
	const { border, color, dimensions, typography } = InspectorControlsGroups;
	const appearanceFills = [
		...( useSlotFills( border.Slot.__unstableName ) || [] ),
		...( useSlotFills( color.Slot.__unstableName ) || [] ),
		...( useSlotFills( dimensions.Slot.__unstableName ) || [] ),
		...( useSlotFills( typography.Slot.__unstableName ) || [] ),
	];

	return (
		<>
			{ ! appearanceFills.length && (
				<span className="block-editor-block-inspector__no-block-tools">
					{ hasSingleBlockSelection
						? __( 'This block has no style options.' )
						: __( 'The selected blocks have no style options.' ) }
				</span>
			) }
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
				__experimentalGroup="layout"
				label={ __( 'Layout' ) }
			/>
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

export default AppearanceTab;
