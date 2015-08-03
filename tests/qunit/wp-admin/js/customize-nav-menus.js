/* global wp */
jQuery( window ).load( function (){

	var api = wp.customize,
		primaryMenuId = 3,
		socialMenuId = 2;

	module( 'Customize Nav Menus' );

	/**
	 * Generate 20 ids and verify they are all unique.
	 */
	test( 'generatePlaceholderAutoIncrementId generates unique IDs', function() {
		var testIterations = 20,
			ids = [ api.Menus.generatePlaceholderAutoIncrementId() ];

		while ( testIterations ) {
			var placeholderID = api.Menus.generatePlaceholderAutoIncrementId();

			ok( -1 === ids.indexOf( placeholderID ) );
			ids.push( placeholderID );
			testIterations -= 1;
		}

	} );

	test( 'it should parse _wpCustomizeMenusSettings.defaults into itself', function() {
		deepEqual( window._wpCustomizeNavMenusSettings, api.Menus.data );
	} );

	test( 'empty menus should have no Menu Item Controls', function() {
		ok( 0 === wp.customize.Menus.getMenuControl( socialMenuId ).getMenuItemControls().length, 'empty menus' );
	} );

	test( 'populated menus should have no Menu Item Controls', function() {
		ok( 0 !== wp.customize.Menus.getMenuControl( primaryMenuId ).getMenuItemControls().length, 'non-empty menus' );
	} );

	// @todo Add tests for api.Menus.AvailableMenuItemsPanelView (and api.Menus.AvailableItemCollection, api.Menus.AvailableItemCollection, api.Menus.AvailableItemModel)

	test( 'there is a properly configured MenusPanel', function() {
		var panel, sections;

		panel = api.panel( 'nav_menus' );
		ok( panel );
		ok( panel.extended( api.Menus.MenusPanel ) );

		sections = panel.sections();
		ok( 'menu_locations' === sections[0].id, 'first section is menu_locations' );
		ok( sections[1].extended( api.Menus.MenuSection ), 'second section is MenuSection' );
		ok( sections[ sections.length - 1 ].extended( api.Menus.NewMenuSection ), 'last section is NewMenuSection' );
	} );
	// @todo Add more tests for api.Menus.MenusPanel behaviors

	test( 'there an expected MenuSection for the primary menu', function() {
		var section, controls;

		section = api.section( 'nav_menu[' + primaryMenuId + ']' );
		ok( section, 'section exists' );
		ok( section.extended( api.Menus.MenuSection ), 'section is a api.Menus.MenuSection' );
		ok( section.deferred.initSortables, 'has section.deferred.initSortables' );
		ok( section.active(), 'section active() is true' );
		ok( section.active.set( false ).get(), 'section active() cannot be set false' );

		controls = section.controls();
		ok( controls[0].extended( api.Menus.MenuNameControl ), 'first control in menu section is MenuNameControl' );
		ok( controls[1].extended( api.Menus.MenuItemControl ), 'second control in menu section is MenuItemControl' );
		ok( controls[ controls.length - 1 ].extended( api.Menus.MenuAutoAddControl ), 'last control in menu section is a MenuAutoAddControl' );
	} );
	// @todo Add more tests for api.Menus.MenuSection behaviors

	test( 'changing a MenuNameControl change the corresponding menu value', function() {
		var section, control;

		section = api.section( 'nav_menu[' + primaryMenuId + ']' );
		control = section.controls()[0];
		ok( control.extended( api.Menus.MenuNameControl ), 'control is a MenuNameControl' );
		equal( control.setting().name, 'Primary menu' );
		ok( ! control.setting._dirty );
		control.container.find( 'input[type=text]:first' ).val( 'Main menu' ).trigger( 'change' );
		equal( control.setting().name, 'Main menu' );
		ok( control.setting._dirty );
	} );
	// @todo Add more tests for api.Menus.MenuNameControl

	test( 'manipulating a MenuItemControl works', function() {
		var section, control, value;
		section = api.section( 'nav_menu[' + primaryMenuId + ']' );
		ok( section );

		control = section.controls()[1];
		ok( control.extended( api.Menus.MenuItemControl ), 'control is a MenuItemControl' );

		control.actuallyEmbed();

		control.container.find( '.edit-menu-item-title' ).val( 'Hello World' ).trigger( 'change' );
		equal( control.setting().title, 'Hello World' );
		value = _.clone( control.setting() );
		value.title = 'Hola Mundo';
		equal( control.container.find( '.edit-menu-item-title' ).val(), 'Hello World' );
		equal( value.position, 1 );
		equal( control.priority(), 1 );

		// @todo test control.moveDown();
	} );
	// @todo Add more tests for api.Menus.MenuItemControl

	// @todo Add tests for api.Menus.NewMenuSection
	// @todo Add tests for api.Menus.MenuLocationControl
	// @todo Add tests for api.Menus.MenuAutoAddControl
	// @todo Add tests for api.Menus.MenuControl
	// @todo Add tests for api.Menus.NewMenuControl
	// @todo Add tests for api.Menus.applySavedData
	// @todo Add tests for api.Menus.focusMenuItemControl

	test( 'api.Menus.getMenuControl() should return the expected control', function() {
		var control = api.Menus.getMenuControl( primaryMenuId );
		ok( !! control, 'control is returned' );
		ok( control.extended( api.Menus.MenuControl ), 'control is a MenuControl' );
	} );

	test( 'api.Menus.getMenuItemControl() should return the expected control', function() {
		var control = api.Menus.getMenuItemControl( 2000 );
		ok( !! control, 'control is returned' );
		ok( control.extended( api.Menus.MenuItemControl ), 'control is a MenuItemControl' );
	} );

} );
