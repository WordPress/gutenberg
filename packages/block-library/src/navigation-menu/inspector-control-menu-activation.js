/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { RadioControl, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default ( { selected, onChange } ) => {
	return (
		<PanelBody title={ __( 'Dropdown Menu Activation' ) }>
			<RadioControl
				options={ [
					{
						label: __('Hover / Focus Event.' ),
						value: 'onHover',
					},
					{
						label: __('Click / Tap Event.' ),
						value: 'onClick',
					}
				] }
				selected={ selected }
				onChange={ onChange }
				label={ __( 'Dropdown menu activation' ) }
				help={ __( 'Select the way of how the dropdown menu will be activated.' ) }
			/>
		</PanelBody>
	)
};
