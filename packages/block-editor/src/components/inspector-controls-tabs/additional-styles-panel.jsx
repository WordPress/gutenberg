import { __ } from '@wordpress/i18n';
import { default as InspectorControls } from '../inspector-controls';

/**
 * Renders the "Additional styles" panel for the block inspector.
 *
 * The panel holds advanced styling controls such as Additional CSS, which live
 * in the `additional-styles` group. It renders nothing when the group has no
 * fills.
 */
const AdditionalStyles = () => (
	<InspectorControls.Slot
		group="additional-styles"
		label={ __( 'Additional styles' ) }
	/>
);

export default AdditionalStyles;
