/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import {
	ToggleControl,
} from '@wordpress/components';

function ResponsiveBlockControl( props ) {
	const { legend = '', isOpen = false, onToggleResponsive, renderDefaultControl, renderResponsiveControl } = props;

	return (

		<fieldset className="block-editor-responsive-block-control">
			<legend className="block-editor-responsive-block-control__label">{ legend }</legend>

			{ ! isOpen && renderDefaultControl() }

			{ isOpen && renderResponsiveControl() }

			<ToggleControl
				label={ __( 'Manually adjust padding based on screensize.' ) }
				checked={ isOpen }
				onChange={ onToggleResponsive }
			/>
		</fieldset>

	);
}

export default ResponsiveBlockControl;
