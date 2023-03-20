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
	// Determine whether the panel should be expanded.
	const { initialOpen } = useSelect( ( select ) => {
		const { getBlocksByClientId, getSelectedBlockClientIds } =
			select( blockEditorStore );

		// If any selected block has a position set, open the panel by default.
		// The first block's value will still be used within the control though.
		const clientIds = getSelectedBlockClientIds();
		const multiSelectedBlocks = getBlocksByClientId( clientIds );

		return {
			initialOpen: multiSelectedBlocks.some(
				( { attributes } ) => !! attributes?.style?.position?.type
			),
		};
	}, [] );

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
