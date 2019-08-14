( function() {
	var registerBlockType = wp.blocks.registerBlockType;
	var el = wp.element.createElement;

	registerBlockType( 'test/test-meta-attribute-block', {
		title: 'Test Meta Attribute Block',
		icon: 'star',
		category: 'common',

		edit: function( props ) {
			var editEntity = wp.data.useDispatch()( 'core/editor' ).editEntity;
			return el( 'input', {
				className: 'my-meta-input',
				value: wp.data.useSelect(
					( select ) =>
						select( 'core/editor' ).getEditedEntityAttribute( 'meta' ).my_meta,
					[]
				),
				onChange: function( event ) {
					editEntity( {
						meta: { my_meta: event.target.value },
					} );
				},
			} );
		},

		save: function() {
			return null;
		},
	} );
} )();
