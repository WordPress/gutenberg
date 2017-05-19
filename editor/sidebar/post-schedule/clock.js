/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import Button from 'components/button';

function PostScheduleClock( { selected, onChange } ) {
	const minutes = selected ? selected.format( 'mm' ) : '';
	const am = selected ? selected.format( 'A' ) : 'AM';
	const hours = selected ? selected.format( 'hh' ) : '';

	const updateHours = ( event ) => {
		const value = parseInt( event.target.value, 10 );
		if ( value < 1 || value > 12 ) {
			return;
		}
		const newDate = selected.clone().hours( am === 'AM' ? value % 12 : ( ( ( value % 12 ) + 12 ) % 24 ) );
		onChange( newDate );
	};

	const updateMinutes = ( event ) => {
		const value = parseInt( event.target.value, 10 );
		if ( value < 0 || value > 59 ) {
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
		<div className="editor-post-schedule__clock">
			<input
				className="editor-post-schedule__clock-input"
				type="text"
				value={ hours }
				onChange={ updateHours }
			/>
			<span className="editor-post-schedule__clock-separator">:</span>
			<input
				className="editor-post-schedule__clock-input"
				type="text"
				value={ minutes }
				onChange={ updateMinutes }
			/>
			<div>
				<Button
					className="button-secondary editor-post-schedule__clock-am-button"
					isToggled={ am === 'AM' }
					onClick={ setAM }
				>
					{ __( 'AM' ) }
				</Button>
				<Button
					className="button-secondary editor-post-schedule__clock-pm-button"
					isToggled={ am === 'PM' }
					onClick={ setPM }
				>
					{ __( 'PM' ) }
				</Button>
			</div>
		</div>
	);
}

export default PostScheduleClock;
