/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControlsGroups from '../inspector-controls/groups';
import { default as InspectorControls } from '../inspector-controls';
import { store as blockEditorStore } from '../../store';

const PositionControlsPanel = () => {
	const { blockAttributes } = useSelect( ( select ) => {
		const { getBlockAttributes, getSelectedBlockClientIds } =
			select( blockEditorStore );
		const clientIds = getSelectedBlockClientIds();
		return {
			blockAttributes: getBlockAttributes( clientIds[ 0 ] ),
		};
	}, [] );

	// If a position type is set, open the panel by default.
	// In a multi-selection, use the first block's attributes for the check.
	const initialOpen = !! blockAttributes?.style?.position?.type;

	return (
		<PanelBody
			className="block-editor-block-inspector__position"
			title={ __( 'Position' ) }
			initialOpen={ initialOpen }
		>
			<InspectorControls.Slot group="position" />
		</PanelBody>
	);
};

const PositionControls = () => {
	const fills = useSlotFills(
		InspectorControlsGroups.position.Slot.__unstableName
	);
	const hasFills = Boolean( fills && fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return <PositionControlsPanel />;
};

export default PositionControls;
