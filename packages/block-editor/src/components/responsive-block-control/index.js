/**
 * External dependencies
 */
import { uniqueId } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

import { Fragment, useState } from '@wordpress/element';

import {
	ToggleControl,
} from '@wordpress/components';

export function ResponsiveBlockControlLabel( { property, device } ) {
	const accessibleLabel = sprintf( __( 'Controls the %s property for %s devices.' ), property, device );
	const descId = uniqueId();
	return (
		<Fragment>
			<span aria-describedby={ `rbc-desc-${ descId }` }>
				{ device }
			</span>
			<span className="screen-reader-text" id={ `rbc-desc-${ descId }` }>{ accessibleLabel }</span>
		</Fragment>
	);
}

function ResponsiveBlockControl( props ) {
	const { legend, property, toggleLabel, responsiveControlsActive = false, renderDefaultControl, defaultLabel = __( 'All' ), devices = [ __( 'Desktop' ), __( 'Tablet' ), __( 'Mobile' ) ], renderResponsiveControls } = props;

	const [ isResponsiveMode, setIsResponsiveMode ] = useState( responsiveControlsActive );

	if ( ! legend || ! property || ! renderDefaultControl ) {
		return null;
	}

	const toggleControlLabel = toggleLabel || sprintf( __( 'Use the same %s on all screensizes.' ), property );

	const toggleHelpText = __( 'Toggle between using the same value for all screen sizes or using a unique value per screen size.' );

	const defaultControl = renderDefaultControl( defaultLabel );

	const defaultResponsiveControls = () => {
		return devices.map( ( deviceLabel, index ) => (
			<Fragment key={ index }>
				{ renderDefaultControl( deviceLabel ) }
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
