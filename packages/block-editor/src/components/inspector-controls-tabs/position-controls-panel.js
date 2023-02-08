/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControlsGroups from '../inspector-controls/groups';
import { default as InspectorControls } from '../inspector-controls';

const PositionControls = () => {
	const fills = useSlotFills(
		InspectorControlsGroups.position.Slot.__unstableName
	);
	const hasFills = Boolean( fills && fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__position"
			title={ __( 'Position' ) }
			initialOpen={ false }
		>
			<InspectorControls.Slot group="position" />
		</PanelBody>
	);
};

export default PositionControls;
