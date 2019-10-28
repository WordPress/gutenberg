/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

import { Fragment, useState, useEffect } from '@wordpress/element';

import { withInstanceId } from '@wordpress/compose';

import {
	ToggleControl,
} from '@wordpress/components';

const ResponsiveBlockControlLabel = withInstanceId( function ResponsiveBlockControlLabel( { instanceId, property, device } ) {
	const accessibleLabel = sprintf( __( 'Controls the %s property for %s devices.' ), property, device );
	return (
		<Fragment>
			<span aria-describedby={ `rbc-desc-${ instanceId }` }>
				{ device }
			</span>
			<span className="screen-reader-text" id={ `rbc-desc-${ instanceId }` }>{ accessibleLabel }</span>
		</Fragment>
	);
} );

function ResponsiveBlockControl( props ) {
	const { legend, property, toggleLabel, responsiveControlsActive = false, onIsResponsiveModeChange, renderDefaultControl, defaultLabel = __( 'All' ), devices = [ __( 'Desktop' ), __( 'Tablet' ), __( 'Mobile' ) ], renderResponsiveControls } = props;

	const [ isResponsiveMode, setIsResponsiveMode ] = useState( responsiveControlsActive );

	useEffect( () => {
		if ( isFunction( onIsResponsiveModeChange ) ) {
			onIsResponsiveModeChange( isResponsiveMode );
		}
	}, [ isResponsiveMode ] );

	if ( ! legend || ! property || ! renderDefaultControl ) {
		return null;
	}

	const toggleControlLabel = toggleLabel || sprintf( __( 'Use the same %s on all screensizes.' ), property );

	const toggleHelpText = __( 'Toggle between using the same value for all screen sizes or using a unique value per screen size.' );

	const defaultControl = renderDefaultControl( <ResponsiveBlockControlLabel property={ property } device={ defaultLabel } /> );

	const defaultResponsiveControls = () => {
		return devices.map( ( deviceLabel, index ) => (
			<Fragment key={ index }>
				{ renderDefaultControl( <ResponsiveBlockControlLabel property={ property } device={ deviceLabel } /> ) }
			</Fragment>
		)
		);
	};

	const handleToggle = ( isChecked ) => {
		setIsResponsiveMode( ! isChecked );
	};

	return (

		<fieldset className="block-editor-responsive-block-control">
			<legend className="block-editor-responsive-block-control__legend">{ legend }</legend>

			<div className="block-editor-responsive-block-control__inner">
				<ToggleControl
					className="block-editor-responsive-block-control__toggle"
					label={ toggleControlLabel }
					checked={ ! isResponsiveMode }
					onChange={ handleToggle }
					help={ toggleHelpText }
				/>

				<div className="block-editor-responsive-block-control__group block-editor-responsive-block-control__group--default" hidden={ isResponsiveMode }>
					{ defaultControl }
				</div>

				<div className="block-editor-responsive-block-control__group block-editor-responsive-block-control__group--responsive" hidden={ ! isResponsiveMode }>
					{ ( renderResponsiveControls ? renderResponsiveControls( devices ) : defaultResponsiveControls() ) }
				</div>

			</div>
		</fieldset>
	);
}

export default ResponsiveBlockControl;
