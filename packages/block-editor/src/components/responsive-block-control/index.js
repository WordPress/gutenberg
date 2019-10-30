/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

import { Fragment, useState, useEffect, useCallback } from '@wordpress/element';

import {
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ResponsiveBlockControlLabel from './label';

function ResponsiveBlockControl( props ) {
	const {
		title,
		property,
		toggleLabel,
		onIsResponsiveModeChange,
		renderDefaultControl,
		renderResponsiveControls,
		responsiveControlsActive = false,
		defaultLabel = {
			id: 'all',
			label: __( 'All' ), /* translators: 'Label. Used to signify a layout property (eg: margin, padding) will apply uniformly to all screensizes.' */
		},
		devices = [
			{
				id: 'small',
				label: __( 'Small devices' ),
			},
			{
				id: 'medium',
				label: __( 'Medium devices' ),
			},
			{
				id: 'large',
				label: __( 'Large devices' ),
			},
		],
	} = props;

	const [ isResponsiveMode, setIsResponsiveMode ] = useState( responsiveControlsActive );

	useEffect( () => {
		if ( isFunction( onIsResponsiveModeChange ) ) {
			onIsResponsiveModeChange( isResponsiveMode );
		}
	}, [ isResponsiveMode ] );

	const handleToggle = useCallback( ( isChecked ) => {
		setIsResponsiveMode( ! isChecked );
	} );

	if ( ! title || ! property || ! renderDefaultControl ) {
		return null;
	}

	/* translators: 'Toggle control label. Should the property be the same across all screen sizes or unique per screen size.'. %s property value for the control (eg: margin, padding...etc) */
	const toggleControlLabel = toggleLabel || sprintf( __( 'Use the same %s on all screensizes.', ), property );

	/* translators: 'Help text for the responsive mode toggle control.' */
	const toggleHelpText = __( 'Toggle between using the same value for all screen sizes or using a unique value per screen size.' );

	const defaultControl = renderDefaultControl( <ResponsiveBlockControlLabel property={ property } device={ defaultLabel } />, defaultLabel );

	const defaultResponsiveControls = () => {
		return devices.map( ( device ) => (
			<Fragment key={ device.id }>
				{ renderDefaultControl( <ResponsiveBlockControlLabel property={ property } device={ device } />, device ) }
			</Fragment>
		) );
	};

	return (

		<fieldset className="block-editor-responsive-block-control">
			<legend className="block-editor-responsive-block-control__title">{ title }</legend>

			<div className="block-editor-responsive-block-control__inner">
				<ToggleControl
					className="block-editor-responsive-block-control__toggle"
					label={ toggleControlLabel }
					checked={ ! isResponsiveMode }
					onChange={ handleToggle }
					help={ toggleHelpText }
				/>

				{ ! isResponsiveMode && (
					<div className="block-editor-responsive-block-control__group block-editor-responsive-block-control__group--default" >
						{ defaultControl }
					</div>
				) }

				{ isResponsiveMode && (
					<div className="block-editor-responsive-block-control__group block-editor-responsive-block-control__group--responsive" hidden={ ! isResponsiveMode }>
						{ ( renderResponsiveControls ? renderResponsiveControls( devices ) : defaultResponsiveControls() ) }
					</div>
				) }

			</div>
		</fieldset>
	);
}

export default ResponsiveBlockControl;
