/**
 * Fields the test plugin registers for Pages on the client, with the public
 * `registerEntityField` of `@wordpress/editor`, rather than on the server.
 *
 * The screens that read the fields from the server add these after the
 * server ones. `menu_order` is a field the plugin also registers on the
 * server, so the screens keep the server one and leave this one out.
 */
( function () {
	const { createElement } = window.wp.element;
	const { registerEntityField } = window.wp.editor;

	registerEntityField( 'postType', 'page', {
		id: 'client_rating',
		type: 'text',
		label: 'Client rating',
		enableSorting: false,
		enableHiding: true,
		filterBy: false,
		readOnly: true,
		getValue: () => 'Five stars',
		render: ( { item, field } ) =>
			createElement(
				'span',
				{ className: 'gutenberg-test-client-rating' },
				field.getValue( { item } )
			),
	} );

	registerEntityField( 'postType', 'page', {
		id: 'menu_order',
		type: 'integer',
		label: 'Client order',
		enableSorting: false,
		filterBy: false,
	} );
} )();
