/**
 * External dependencies
 */
import { createElement } from '@wordpress/elements';
import { registerBlock, Editable } from '@wordpress/blocks';

registerBlock( 'wp', 'Text', {
	edit( state, onChange ) {
		return createElement( Editable, {
			value: state.value,
			onChange: ( value ) => onChange( { value } )
		} );
	},
	save( state ) {
		return createElement( 'p', null, state.value );
	}
} );
