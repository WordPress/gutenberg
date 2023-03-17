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

const PositionControls = ( { clientId } ) => {
	const fills = useSlotFills(
		InspectorControlsGroups.position.Slot.__unstableName
	);
	const hasFills = Boolean( fills && fills.length );

	const { blockAttributes } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return {
				blockAttributes: getBlockAttributes( clientId ),
			};
		},
		[ clientId ]
	);

	if ( ! hasFills ) {
		return null;
	}

	// If a position type is set, open the panel by default.
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

export default PositionControls;
