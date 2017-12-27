/**
 * External dependencies
 */
import { isInteger } from 'lodash';
import moment from 'moment';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import Button from '../button';
import { settings } from '@wordpress/date';

export function TimePicker( { currentTime, onChange } ) {

	const selected = currentTime ? moment( currentTime ) : moment();

	// To know if the current timezone is a 12 hour time with look for "a" in the time format
	// We also make sure this a is not escaped by a "/"
	const is12Hour = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase() // Test only the lower case a
			.replace( /\\\\/g, '' ) // Replace "//" with empty strings
			.split( '' ).reverse().join( '' ) // Reverse the string and test for "a" not followed by a slash
	);

	const minutes = selected.format( 'mm' );
	const am = selected.format( 'A' );
	const hours = selected.format( is12Hour ? 'hh' : 'HH' );

	const updateHours = ( event ) => {
		const value = parseInt( event.target.value, 10 );
		if (
			! isInteger( value ) ||
			( is12Hour && ( value < 1 || value > 12 ) ) ||
			( ! is12Hour && ( value < 0 || value > 23 ) )
		) {
			return;
		}

		const newDate = is12Hour ?
			selected.clone().hours( am === 'AM' ? value % 12 : ( ( ( value % 12 ) + 12 ) % 24 ) ) :
			selected.clone().hours( value );
		onChange( newDate );
	};

	const updateMinutes = ( event ) => {
		const value = parseInt( event.target.value, 10 );
		if ( ! isInteger( value ) || value < 0 || value > 59 ) {
			return;
		}
		const newDate = selected.clone().minutes( value );
		onChange( newDate );
	};

	const setAM = () => {
		if ( am === 'AM' ) {
			return;
		}
		const newDate = selected.clone().hours( parseInt( hours, 10 ) % 12 );
		onChange( newDate );
	};

	const setPM = () => {
		if ( am === 'PM' ) {
			return;
		}
		const newDate = selected.clone().hours( ( ( parseInt( hours, 10 ) % 12 ) + 12 ) % 24 );
		onChange( newDate );
	};

	return (
		<div className="components-time-picker">
			<input
				className="components-time-picker__input"
				type="text"
				value={ hours }
				onChange={ updateHours }
			/>
			<span className="components-time-picker__separator">:</span>
			<input
				className="components-time-picker__input"
				type="text"
				value={ minutes }
				onChange={ updateMinutes }
			/>
			{ is12Hour && <div>
				<Button
					className="button components-time-picker__am-button"
					isToggled={ am === 'AM' }
					onClick={ setAM }
				>
					{ __( 'AM' ) }
				</Button>
				<Button
					className="button components-time-picker__pm-button"
					isToggled={ am === 'PM' }
					onClick={ setPM }
				>
					{ __( 'PM' ) }
				</Button>
			</div> }
		</div>
	);
}
