/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockStyles from '../block-styles';
import DefaultStylePicker from '../default-style-picker';
import InspectorControls from '../inspector-controls';

const StylesTab = ( { blockName, clientId, hasBlockStyles } ) => {
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
				group="color"
				label={ __( 'Color' ) }
				className="color-block-support-panel__inner-wrapper"
			/>
			<InspectorControls.Slot
				group="typography"
				label={ __( 'Typography' ) }
			/>
			<InspectorControls.Slot
				group="dimensions"
				label={ __( 'Dimensions' ) }
			/>
			<InspectorControls.Slot group="border" label={ __( 'Border' ) } />
			<InspectorControls.Slot group="styles" />
		</>
	);
};

export default StylesTab;
