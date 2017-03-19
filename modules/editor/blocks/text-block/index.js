wp.blocks.registerBlock( 'wp', 'Text', {
	edit( state, onChange ) {
		return wp.elements.createElement( wp.blocks.Editable, {
			value: state.value,
			onChange: ( value ) => onChange( { value } )
		} );
	},
	save( state ) {
		return wp.elements.createElement( 'p', null, state.value );
	}
} );
