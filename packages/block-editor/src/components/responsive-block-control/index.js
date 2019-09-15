/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

import {
	ToggleControl,
} from '@wordpress/components';

function ResponsiveBlockControl( props ) {
	const { legend = '', property, toggleLabel, isOpen = false, onToggleResponsive, renderDefaultControl, defaultLabel = __( 'All' ), devices = [ __( 'Desktop' ), __( 'Tablet' ), __( 'Mobile' ) ], renderResponsiveControls } = props;

	if ( ! legend || ! property || ! renderDefaultControl ) {
		return null;
	}

	const toggleControlLabel = toggleLabel || sprintf( __( 'Manually adjust %s based on screensize.' ), property );

	const defaultControl = (
		<fieldset>
			<legend>{ defaultLabel }</legend>
			{ renderDefaultControl( defaultLabel ) }
		</fieldset>
	);

	const responsiveControls = devices.map( ( deviceLabel ) => {
		return (
			<fieldset key={ deviceLabel }>
				<legend>{ deviceLabel }</legend>
				{ renderDefaultControl( deviceLabel ) }
			</fieldset>
		);
	} );

	return (

		<fieldset className="block-editor-responsive-block-control">
			<legend className="block-editor-responsive-block-control__label">{ legend }</legend>

			<div className="block-editor-responsive-block-control__inner">
				{ ! isOpen && defaultControl }

				{ isOpen && ( renderResponsiveControls ? renderResponsiveControls() : responsiveControls ) }

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
