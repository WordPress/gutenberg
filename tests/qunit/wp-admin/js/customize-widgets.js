/* global wp */
jQuery( window ).load( function() {

	var api = wp.customize, $ = jQuery;

	module( 'Customize Widgets' );

	test( 'fixtures should be present', function() {
		var widgetControl;
		ok( api.panel( 'widgets' ) );
		ok( api.section( 'sidebar-widgets-sidebar-1' ) );
		widgetControl = api.control( 'widget_search[2]' );
		ok( widgetControl );
		ok( api.control( 'sidebars_widgets[sidebar-1]' ) );
		ok( api( 'widget_search[2]' ) );
		ok( api( 'sidebars_widgets[sidebar-1]' ) );
		ok( widgetControl.params.content );
		ok( widgetControl.params.widget_control );
		ok( widgetControl.params.widget_content );
		ok( widgetControl.params.widget_id );
		ok( widgetControl.params.widget_id_base );
	});

	test( 'widget contents should embed (with widget-added event) when section and control expand', function() {
		var control, section, widgetAddedEvent = null, widgetControlRootElement = null;
		control = api.control( 'widget_search[2]' );
		section = api.section( 'sidebar-widgets-sidebar-1' );

		$( document ).on( 'widget-added', function( event, widgetElement ) {
			widgetAddedEvent = event;
			widgetControlRootElement = widgetElement;
		});

		ok( ! section.expanded() );
		ok( 0 === control.container.find( '> .widget' ).length );

		// Preview sets the active state.
		section.active.set( true );
		control.active.set( true );
		api.control( 'sidebars_widgets[sidebar-1]' ).active.set( true );

		section.expand();
		ok( ! widgetAddedEvent, 'expected widget added event not fired' );
		ok( 1 === control.container.find( '> .widget' ).length, 'expected there to be one .widget element in the container' );
		ok( 0 === control.container.find( '.widget-content' ).children().length );

		control.expand();
		ok( 1 === control.container.find( '.widget-content' ).children().length );
		ok( widgetAddedEvent );
		ok( widgetControlRootElement.is( control.container.find( '> .widget' ) ) );
		ok( 1 === control.container.find( '.widget-content #widget-search-2-title' ).length );

		$( document ).off( 'widget-added' );
	});

	test( 'widgets panel should have notice', function() {
		var panel = api.panel( 'widgets' );
		ok( panel.extended( api.Widgets.WidgetsPanel ) );

		panel.deferred.embedded.done( function() {
			ok( 1 === panel.contentContainer.find( '.no-widget-areas-rendered-notice' ).length );
			ok( panel.contentContainer.find( '.no-widget-areas-rendered-notice' ).is( ':visible' ) );
			api.section( 'sidebar-widgets-sidebar-1' ).active( true );
			api.control( 'sidebars_widgets[sidebar-1]' ).active( true );
			api.trigger( 'pane-contents-reflowed' );
			ok( ! panel.contentContainer.find( '.no-widget-areas-rendered-notice' ).is( ':visible' ) );
		} );

		expect( 4 );
	});
});
