/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

import {
	ToggleControl,
} from '@wordpress/components';

function ResponsiveBlockControl( props ) {
	const { legend = '', property, toggleLabel, isOpen = false, onToggleResponsive, renderDefaultControl, renderResponsiveControl } = props;

	if ( ! legend || ! property ) {
		return null;
	}

	const toggleControlLabel = toggleLabel || sprintf( __( 'Manually adjust %s based on screensize.' ), property );

	return (

		<fieldset className="block-editor-responsive-block-control">
			<legend className="block-editor-responsive-block-control__label">{ legend }</legend>

			<div className="block-editor-responsive-block-control__inner">
				{ ! isOpen && renderDefaultControl() }

				{ isOpen && renderResponsiveControl() }

				<ToggleControl
					label={ toggleControlLabel }
					checked={ isOpen }
					onChange={ onToggleResponsive }
				/>
			</div>
		</fieldset>

	);
}

export default ResponsiveBlockControl;
