import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { default as InspectorControls } from '../inspector-controls';
import groups from '../inspector-controls/groups';

/**
 * Renders the "Additional styles" panel for the block inspector.
 *
 * The panel holds advanced styling controls such as Additional CSS, which live
 * in the `additional-styles` group. It renders nothing when the group has no
 * fills.
 *
 * @param {Object}  props               Component props.
 * @param {boolean} [props.initialOpen] Whether the panel starts expanded.
 */
const AdditionalStyles = ( { initialOpen = false } ) => {
	const fills = useSlotFills( groups[ 'additional-styles' ].name );

	if ( ! fills?.length ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__additional-styles"
			title={ __( 'Additional styles' ) }
			initialOpen={ initialOpen }
		>
			<InspectorControls.Slot group="additional-styles" />
		</PanelBody>
	);
};

export default AdditionalStyles;
