/**
 * WordPress dependencies
 */
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const OffsetControl = ( { offset = 0, onChange } ) => {
	return (
		<NumberControl
			label={ __( 'Offset' ) }
			value={ offset }
			min={ 0 }
			onChange={ ( newOffset ) => {
				onChange( { offset: newOffset } );
			} }
		/>
	);
};

export default OffsetControl;
