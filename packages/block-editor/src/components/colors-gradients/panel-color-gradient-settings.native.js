/**
 * WordPress dependencies
 */
import { PanelBody, UnsupportedFooterControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const PanelColorGradientSettings = () => {
	return (
		<PanelBody>
			<UnsupportedFooterControl
				label={ __( 'Color settings are coming soon.' ) }
			/>
		</PanelBody>
	);
};
export default PanelColorGradientSettings;
