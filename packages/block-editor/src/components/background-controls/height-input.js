/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { BaseControl } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { COVER_MIN_HEIGHT } from './shared';

export default withInstanceId(
	function( { value = '', instanceId, onChange } ) {
		const [ temporaryInput, setTemporaryInput ] = useState( null );
		const inputId = `block-cover-height-input-${ instanceId }`;
		return (
			<BaseControl label={ __( 'Minimum height in pixels' ) } id={ inputId }>
				<input
					type="number"
					id={ inputId }
					onChange={ ( event ) => {
						const unprocessedValue = event.target.value;
						const inputValue = unprocessedValue !== '' ?
							parseInt( event.target.value, 10 ) :
							undefined;
						if ( ( isNaN( inputValue ) || inputValue < COVER_MIN_HEIGHT ) && inputValue !== undefined ) {
							setTemporaryInput( event.target.value );
							return;
						}
						setTemporaryInput( null );
						onChange( inputValue );
					} }
					onBlur={ () => {
						if ( temporaryInput !== null ) {
							setTemporaryInput( null );
						}
					} }
					value={ temporaryInput !== null ? temporaryInput : value }
					min={ COVER_MIN_HEIGHT }
					step="1"
				/>
			</BaseControl>
		);
	}
);
