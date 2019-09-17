/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

import { Fragment } from '@wordpress/element';

import {
	ToggleControl,
} from '@wordpress/components';

export function ResponsiveBlockControlLabel( { property, device } ) {
	return (
		<Fragment>
			<span className="screen-reader-text">
				{ property } for
			</span>
			{ device }
			<span className="screen-reader-text">
			devices
			</span>
		</Fragment>
	);
}

function ResponsiveBlockControl( props ) {
	const { legend, property, toggleLabel, isOpen = false, onToggle = noop, renderDefaultControl, defaultLabel = __( 'All' ), devices = [ __( 'Desktop' ), __( 'Tablet' ), __( 'Mobile' ) ], renderResponsiveControls } = props;

	if ( ! legend || ! property || ! renderDefaultControl ) {
		return null;
	}

	const toggleControlLabel = toggleLabel || sprintf( __( 'Use the same %s on all screensizes.' ), property );

	const defaultControl = renderDefaultControl( defaultLabel );

	const defaultResponsiveControls = devices.map( ( deviceLabel, index ) => {
		return (
			<Fragment key={ index }>
				{ renderDefaultControl( deviceLabel ) }
			</Fragment>
		);
	} );

	return (

		<fieldset className="block-editor-responsive-block-control">
			<legend className="block-editor-responsive-block-control__legend">{ legend }</legend>

			<div className="block-editor-responsive-block-control__inner">
				<ToggleControl
					label={ toggleControlLabel }
					checked={ ! isOpen }
					onChange={ onToggle }
				/>

				{ ! isOpen && defaultControl }

				{ isOpen && ( renderResponsiveControls ? renderResponsiveControls() : defaultResponsiveControls ) }

			</div>
		</fieldset>
	);
}

export default ResponsiveBlockControl;
