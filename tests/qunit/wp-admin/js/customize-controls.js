/* global JSON, wp, test, ok, equal, module */

wp.customize.settingConstructor.abbreviation = wp.customize.Setting.extend({
	validate: function( value ) {
		return value.toUpperCase();
	}
});

jQuery( window ).load( function (){
	'use strict';

	var controlId, controlLabel, controlType, controlContent, controlDescription, controlData, mockControl,
		mockControlInstance, controlExpectedValues, sectionId, sectionContent, sectionData, mockSection,
		sectionInstance, sectionExpectedValues, panelId, panelTitle, panelDescription, panelContent, panelData,
		mockPanel, panelExpectedValues, testCustomizerModel, settingId, settingValue, mockSetting;

	testCustomizerModel = function( model, expectedValues ) {
		if ( ! expectedValues.type || ! wp.customize[ expectedValues.type ] ) {
			throw new Error( 'Must pass value type in expectedValues.' );
		}
		var type = expectedValues.type;
		test( 'Model extends proper type', function () {
			ok( model.extended( wp.customize[ type ] ) );
		} );

		if ( expectedValues.hasOwnProperty( 'id' ) ) {
			test( type + ' instance has the right id', function () {
				equal( model.id, expectedValues.id );
			});
		}
		if ( expectedValues.hasOwnProperty( 'title') ) {
			test( type + ' instance has the right title.', function () {
				equal( model.params.title, expectedValues.title );
			});
		}
		if ( expectedValues.hasOwnProperty( 'description' ) ) {
			test( type + ' instance has the right description.', function () {
				equal( model.params.description, expectedValues.description );
			});
		}
		if ( expectedValues.hasOwnProperty( 'content' ) ) {
			test( type + ' instance has the right content.', function () {
				equal( model.params.content, expectedValues.content );
			});
		}
		if ( expectedValues.hasOwnProperty( 'priority' ) ) {
			test( type + ' instance has the right priority.', function () {
				equal( model.priority(), expectedValues.priority );
			});
		}
		if ( expectedValues.hasOwnProperty( 'active' ) ) {
			test( type + ' instance has the right active state.', function () {
				equal( model.active(), expectedValues.active );
			});
		}
		test( type + ' can be deactivated', function () {
			model.activate();
			model.deactivate();
			equal( model.active(), false );
			model.activate();
			equal( model.active(), true );
			ok(true);
		});

		if ( type === 'Panel' || type === 'Section' ) {
			if ( expectedValues.hasOwnProperty( 'expanded' ) ) {
				test( type + ' instance has the right expanded state.', function () {
					equal( model.expanded(), expectedValues.expanded );
				} );
			}

			test( type + ' instance is collapsed after calling .collapse()', function () {
				model.collapse();
				ok( ! model.expanded() );
			});

			test( type + ' instance is expanded after calling .expand()', function () {
				model.expand();
				ok( model.expanded() );
			});
		}

	};

	module( 'Customizer notifications collection' );
	test( 'Notifications collection exists', function() {
		ok( wp.customize.notifications );
		equal( wp.customize.notifications.defaultConstructor, wp.customize.Notification );
	} );

	test( 'Notification objects are rendered as part of notifications collection', function() {
		var container = jQuery( '#customize-notifications-test' ), items, collection;

		collection = new wp.customize.Notifications({
			container: container
		});
		collection.add( 'mycode-1', new wp.customize.Notification( 'mycode-1' ) );
		collection.render();
		items = collection.container.find( 'li' );
		equal( items.length, 1 );
		equal( items.first().data( 'code' ), 'mycode-1' );

		collection.add( 'mycode-2', new wp.customize.Notification( 'mycode-2', {
			dismissible: true
		} ) );
		collection.render();
		items = collection.container.find( 'li' );
		equal( items.length, 2 );
		equal( items.first().data( 'code' ), 'mycode-2' );
		equal( items.last().data( 'code' ), 'mycode-1' );

		equal( items.first().find( '.notice-dismiss' ).length, 1 );
		equal( items.last().find( '.notice-dismiss' ).length, 0 );

		collection.remove( 'mycode-2' );
		collection.render();
		items = collection.container.find( 'li' );
		equal( items.length, 1 );
		equal( items.first().data( 'code' ), 'mycode-1' );

		collection.remove( 'mycode-1' );
		collection.render();
		ok( collection.container.is( ':hidden' ), 'Notifications area is hidden.' );
	} );

	module( 'Customizer Previewed Device' );
	test( 'Previewed device defaults to desktop.', function () {
		equal( wp.customize.previewedDevice.get(), 'desktop' );
	} );

	module( 'Customizer Setting in Fixture' );
	test( 'Setting has fixture value', function () {
		equal( wp.customize( 'fixture-setting' )(), 'Lorem Ipsum' );
	} );
	test( 'Setting has notifications', function () {
		var setting = wp.customize( 'fixture-setting' );
		ok( setting.notifications.extended( wp.customize.Values ) );
		equal( wp.customize.Notification, setting.notifications.prototype.constructor.defaultConstructor );
	} );
	test( 'Setting has findControls method', function() {
		var controls, setting = wp.customize( 'fixture-setting' );
		equal( 'function', typeof setting.findControls );
		controls = setting.findControls();
		equal( 1, controls.length );
		equal( 'fixture-control', controls[0].id );
	} );
	test( 'Setting constructor object exists', function( assert ) {
		assert.ok( _.isObject( wp.customize.settingConstructor ) );
	} );
	test( 'Custom setting constructor is used', function( assert ) {
		var setting = wp.customize( 'fixture-setting-abbr' );
		assert.ok( setting.extended( wp.customize.settingConstructor.abbreviation ) );
		setting.set( 'usa' );
		assert.equal( 'USA', setting.get() );
	} );

	module( 'Customizer Control in Fixture' );
	test( 'Control exists', function () {
		ok( wp.customize.control.has( 'fixture-control' ) );
	} );
	test( 'Control has the fixture setting', function () {
		var control = wp.customize.control( 'fixture-control' );
		equal( control.setting(), 'Lorem Ipsum' );
		equal( control.setting.id, 'fixture-setting' );
	} );
	test( 'Control has the section fixture section ID', function () {
		var control = wp.customize.control( 'fixture-control' );
		equal( control.section(), 'fixture-section' );
	} );
	test( 'Control has notifications', function ( assert ) {
		var control = wp.customize.control( 'fixture-control' ), settingNotification, controlOnlyNotification, doneEmbedded;
		assert.ok( control.notifications.extended( wp.customize.Values ) );
		assert.equal( wp.customize.Notification, control.notifications.prototype.constructor.defaultConstructor );
		assert.ok( _.isFunction( control.getNotificationsContainerElement ) );
		assert.ok( _.isFunction( control.renderNotifications ) );

		doneEmbedded = assert.async();
		control.deferred.embedded.done( function() {
			var notificationContainerElement;

			assert.equal( 0, _.size( control.notifications._value ) );
			assert.equal( 0, _.size( control.settings['default'].notifications._value ) );

			notificationContainerElement = control.getNotificationsContainerElement();
			assert.equal( 1, notificationContainerElement.length );
			assert.ok( notificationContainerElement.is( '.customize-control-notifications-container' ) );
			assert.equal( 0, notificationContainerElement.find( '> ul > li' ).length );
			assert.equal( 0, notificationContainerElement.height() );

			settingNotification = new wp.customize.Notification( 'setting_invalidity', 'Invalid setting' );
			controlOnlyNotification = new wp.customize.Notification( 'control_invalidity', 'Invalid control' );
			control.settings['default'].notifications.add( settingNotification.code, settingNotification );
			control.notifications.add( controlOnlyNotification.code, controlOnlyNotification );

			// Note that renderNotifications is being called manually here since rendering normally happens asynchronously.
			control.notifications.render();

			assert.equal( 2, notificationContainerElement.find( '> ul > li' ).length );
			assert.notEqual( 'none', notificationContainerElement.css( 'display' ) );
			assert.equal( 2, _.size( control.notifications._value ) );
			assert.equal( 1, _.size( control.settings['default'].notifications._value ) );

			control.notifications.remove( controlOnlyNotification.code );
			control.notifications.render();
			assert.equal( 1, notificationContainerElement.find( '> ul > li' ).length );
			assert.notEqual( 'none', notificationContainerElement.css( 'display' ) );

			control.settings['default'].notifications.remove( settingNotification.code );
			control.notifications.render();
			assert.equal( 0, notificationContainerElement.find( '> ul > li' ).length );
			notificationContainerElement.stop().hide(); // Clean up.

			doneEmbedded();
		} );
	} );

	module( 'Customizer control without associated settings' );
	test( 'Control can be created without settings', function() {
		var control = new wp.customize.Control( 'settingless', {
			params: {
				content: jQuery( '<li class="settingless">Hello World</li>' ),
				section: 'fixture-section'
			}
		} );
		wp.customize.control.add( control.id, control );
		equal( control.deferred.embedded.state(), 'resolved' );
		ok( null === control.setting );
		ok( jQuery.isEmptyObject( control.settings ) );
	} );

	// Begin sections.
	module( 'Customizer Section in Fixture' );
	test( 'Fixture section exists', function () {
		ok( wp.customize.section.has( 'fixture-section' ) );
	} );
	test( 'Fixture section has control among controls()', function () {
		var section = wp.customize.section( 'fixture-section' );
		ok( -1 !== _.pluck( section.controls(), 'id' ).indexOf( 'fixture-control' ) );
	} );
	test( 'Fixture section has has expected panel', function () {
		var section = wp.customize.section( 'fixture-section' );
		equal( section.panel(), 'fixture-panel' );
	} );

	module( 'Customizer Default Section with Template in Fixture' );
	test( 'Fixture section exists', function () {
		ok( wp.customize.section.has( 'fixture-section-default-templated' ) );
	} );
	test( 'Fixture section has expected content', function () {
		var id = 'fixture-section-default-templated', section;
		section = wp.customize.section( id );
		ok( ! section.params.content );
		ok( !! section.container );
		ok( !! section.headContainer );
		ok( !! section.contentContainer );
		ok( section.container.has( section.headContainer ) );
		ok( section.container.has( section.contentContainer ) );
		ok( section.headContainer.is( '.control-section.control-section-default' ) );
		ok( 1 === section.headContainer.find( '> .accordion-section-title' ).length );
		ok( section.contentContainer.is( '.accordion-section-content' ) );
		equal( section.headContainer.attr( 'aria-owns' ), section.contentContainer.attr( 'id' ) );
	} );

	module( 'Customizer Custom Type (titleless) Section with Template in Fixture' );
	test( 'Fixture section exists', function () {
		ok( wp.customize.section.has( 'fixture-section-titleless-templated' ) );
	} );
	test( 'Fixture section has expected content', function () {
		var id = 'fixture-section-titleless-templated', section;
		section = wp.customize.section( id );
		ok( ! section.params.content );
		ok( !! section.container );
		ok( !! section.headContainer );
		ok( !! section.contentContainer );
		ok( section.container.has( section.headContainer ) );
		ok( section.container.has( section.contentContainer ) );
		ok( section.container.is( '.control-section.control-section-titleless' ) );
		ok( 0 === section.headContainer.find( '> .accordion-section-title' ).length );
		ok( section.contentContainer.is( '.accordion-section-content' ) );
		equal( section.headContainer.attr( 'aria-owns' ), section.contentContainer.attr( 'id' ) );
	} );
	module( 'Customizer Custom Type Section Lacking Specific Template' );
	test( 'Fixture section has expected content', function () {
		var id = 'fixture-section-reusing-default-template', section;
		section = wp.customize.section( id );
		ok( ! section.params.content );
		ok( !! section.container );
		ok( !! section.headContainer );
		ok( !! section.contentContainer );
		ok( section.container.has( section.headContainer ) );
		ok( section.container.has( section.contentContainer ) );
		ok( section.headContainer.is( '.control-section.control-section-' + section.params.type ) );
		ok( 1 === section.headContainer.find( '> .accordion-section-title' ).length );
		ok( section.contentContainer.is( '.accordion-section-content' ) );
		equal( section.headContainer.attr( 'aria-owns' ), section.contentContainer.attr( 'id' ) );
	} );
	module( 'Customizer Section lacking any params' );
	test( 'Fixture section has default params supplied', function () {
		var id = 'fixture-section-without-params', section, defaultParams;
		section = wp.customize.section( id );
		defaultParams = {
			title: '',
			description: '',
			priority: 100,
			panel: null,
			type: 'default',
			content: null,
			active: true,
			customizeAction: ''
		};
		jQuery.each( defaultParams, function ( key, value ) {
			ok( 'undefined' !== typeof section.params[ key ] );
			equal( value, section.params[ key ] );
		} );
		ok( _.isNumber( section.params.instanceNumber ) );
	} );


	// Begin panels.
	module( 'Customizer Panel in Fixture' );
	test( 'Fixture panel exists', function () {
		ok( wp.customize.panel.has( 'fixture-panel' ) );
	} );
	test( 'Fixture panel has content', function () {
		var panel = wp.customize.panel( 'fixture-panel' );
		ok( !! panel.params.content );
		ok( !! panel.container );
		ok( !! panel.headContainer );
		ok( !! panel.contentContainer );
		ok( panel.container.has( panel.headContainer ) );
		ok( panel.container.has( panel.contentContainer ) );
	} );
	test( 'Fixture panel has section among its sections()', function () {
		var panel = wp.customize.panel( 'fixture-panel' );
		ok( -1 !== _.pluck( panel.sections(), 'id' ).indexOf( 'fixture-section' ) );
	} );
	test( 'Panel is not expanded by default', function () {
		var panel = wp.customize.panel( 'fixture-panel' );
		ok( ! panel.expanded() );
	} );
	test( 'Panel is not expanded by default', function () {
		var panel = wp.customize.panel( 'fixture-panel' );
		ok( ! panel.expanded() );
	} );
	test( 'Focusing on a control will expand the panel and section', function () {
		var panel, section, control;
		panel = wp.customize.panel( 'fixture-panel' );
		section = wp.customize.section( 'fixture-section' );
		control = wp.customize.control( 'fixture-control' );
		ok( ! panel.expanded() );
		ok( ! section.expanded() );
		control.focus();
		ok( section.expanded() );
		ok( panel.expanded() );
	} );

	module( 'Customizer Default Panel with Template in Fixture' );
	test( 'Fixture section exists', function () {
		ok( wp.customize.panel.has( 'fixture-panel-default-templated' ) );
	} );
	test( 'Fixture panel has expected content', function () {
		var id = 'fixture-panel-default-templated', panel;
		panel = wp.customize.panel( id );
		ok( ! panel.params.content );
		ok( !! panel.container );
		ok( !! panel.headContainer );
		ok( !! panel.contentContainer );
		ok( panel.container.has( panel.headContainer ) );
		ok( panel.container.has( panel.contentContainer ) );
		ok( panel.headContainer.is( '.control-panel.control-panel-default' ) );
		ok( 1 === panel.headContainer.find( '> .accordion-section-title' ).length );
		ok( panel.contentContainer.is( '.control-panel-content' ) );
		equal( panel.headContainer.attr( 'aria-owns' ), panel.contentContainer.attr( 'id' ) );
	} );

	module( 'Customizer Custom Type Panel (titleless) with Template in Fixture' );
	test( 'Fixture panel exists', function () {
		ok( wp.customize.panel.has( 'fixture-panel-titleless-templated' ) );
	} );
	test( 'Fixture panel has expected content', function () {
		var id = 'fixture-panel-titleless-templated', panel;
		panel = wp.customize.panel( id );
		ok( ! panel.params.content );
		ok( !! panel.container );
		ok( !! panel.headContainer );
		ok( !! panel.contentContainer );
		ok( panel.container.has( panel.headContainer ) );
		ok( panel.container.has( panel.contentContainer ) );
		ok( panel.headContainer.is( '.control-panel.control-panel-titleless' ) );
		ok( 0 === panel.headContainer.find( '> .accordion-section-title' ).length );
		ok( panel.contentContainer.is( '.control-panel-content' ) );
		equal( panel.headContainer.attr( 'aria-owns' ), panel.contentContainer.attr( 'id' ) );
	} );

	module( 'Customizer Custom Type Panel Lacking Specific Template' );
	test( 'Fixture panel has expected content', function () {
		var id = 'fixture-panel-reusing-default-template', panel;
		panel = wp.customize.panel( id );
		ok( ! panel.params.content );
		ok( !! panel.container );
		ok( !! panel.headContainer );
		ok( !! panel.contentContainer );
		ok( panel.container.has( panel.headContainer ) );
		ok( panel.container.has( panel.contentContainer ) );
		ok( panel.headContainer.is( '.control-panel.control-panel-' + panel.params.type ) );
		ok( 1 === panel.headContainer.find( '> .accordion-section-title' ).length );
		ok( panel.contentContainer.is( '.control-panel-content' ) );
		equal( panel.headContainer.attr( 'aria-owns' ), panel.contentContainer.attr( 'id' ) );
	} );
	module( 'Customizer Panel lacking any params' );
	test( 'Fixture panel has default params supplied', function () {
		var id = 'fixture-panel-without-params', panel, defaultParams;
		panel = wp.customize.panel( id );
		defaultParams = {
			title: '',
			description: '',
			priority: 100,
			type: 'default',
			content: null,
			active: true
		};
		jQuery.each( defaultParams, function ( key, value ) {
			ok( 'undefined' !== typeof panel.params[ key ] );
			equal( value, panel.params[ key ] );
		} );
		ok( _.isNumber( panel.params.instanceNumber ) );
	} );

	module( 'Dynamically-created Customizer Setting Model' );
	settingId = 'new_blogname';
	settingValue = 'Hello World';

	test( 'Create a new setting', function () {
		mockSetting = wp.customize.create(
			settingId,
			settingId,
			settingValue,
			{
				transport: 'refresh',
				previewer: wp.customize.previewer
			}
		);
		equal( mockSetting(), settingValue );
		equal( mockSetting.id, settingId );
	} );

	module( 'Dynamically-created Customizer Section Model' );

	sectionId = 'mock_title_tagline';
	sectionContent = '<li id="accordion-section-mock_title_tagline" class="accordion-section control-section control-section-default"> <h3 class="accordion-section-title" tabindex="0"> Section Fixture <span class="screen-reader-text">Press return or enter to open</span> </h3> <ul class="accordion-section-content"> <li class="customize-section-description-container"> <div class="customize-section-title"> <button class="customize-section-back" tabindex="-1"> <span class="screen-reader-text">Back</span> </button> <h3> <span class="customize-action">Customizing &#9656; Fixture Panel</span> Section Fixture </h3> </div> </li> </ul> </li>';
	sectionData = {
		content: sectionContent,
		active: true,
		type: 'default'
	};

	mockSection = new wp.customize.Section( sectionId, { params: sectionData } );

	sectionExpectedValues = {
		type: 'Section',
		id: sectionId,
		content: sectionContent,
		priority: 100,
		active: true // @todo This should default to true
	};

	testCustomizerModel( mockSection, sectionExpectedValues );

	test( 'Section has been embedded', function () {
		equal( mockSection.deferred.embedded.state(), 'resolved' );
	} );

	wp.customize.section.add( sectionId, mockSection );

	test( 'Section instance added to the wp.customize.section object', function () {
		ok( wp.customize.section.has( sectionId ) );
	});

	sectionInstance = wp.customize.section( sectionId );

	test( 'Section instance has right content when accessed from wp.customize.section()', function () {
		equal( sectionInstance.params.content, sectionContent );
	});

	test( 'Section instance has no children yet', function () {
		equal( sectionInstance.controls().length, 0 );
	});

	module( 'Dynamically-created Customizer Control Model' );

	controlId = 'new_blogname';
	controlLabel = 'Site Title';
	controlType = 'text';
	controlContent = '<li id="customize-control-blogname" class="customize-control customize-control-text"></li>';
	controlDescription = 'Test control description';

	controlData = {
		content: controlContent,
		description: controlDescription,
		label: controlLabel,
		settings: { 'default': 'new_blogname' },
		type: controlType,
		active: true // @todo This should default to true
	};

	mockControl = new wp.customize.Control( controlId, {
		params: controlData,
		previewer: wp.customize.previewer
	});

	controlExpectedValues = {
		type: 'Control',
		content: controlContent,
		description: controlDescription,
		label: controlLabel,
		id: controlId,
		priority: 10
	};

	testCustomizerModel( mockControl, controlExpectedValues );

	test( 'Control instance does not yet belong to a section.', function () {
		equal( mockControl.section(), undefined );
	});
	test( 'Control has not been embedded yet', function () {
		equal( mockControl.deferred.embedded.state(), 'pending' );
	} );

	test( 'Control instance has the right selector.', function () {
		equal( mockControl.selector, '#customize-control-new_blogname' );
	});

	wp.customize.control.add( controlId, mockControl );

	test( 'Control instance was added to the control class.', function () {
		ok( wp.customize.control.has( controlId ) );
	});

	mockControlInstance = wp.customize.control( controlId );

	test( 'Control instance has the right id when accessed from api.control().', function () {
		equal( mockControlInstance.id, controlId );
	});

	test( 'Control section can be set as expected', function () {
		mockControl.section( mockSection.id );
		equal( mockControl.section(), mockSection.id );
	});
	test( 'Associating a control with a section allows it to be embedded', function () {
		equal( mockControl.deferred.embedded.state(), 'resolved' );
	});

	test( 'Control is now available on section.controls()', function () {
		equal( sectionInstance.controls().length, 1 );
		equal( sectionInstance.controls()[0], mockControl );
	});

	module( 'Dynamically-created Customizer Panel Model' );

	panelId = 'mockPanelId';
	panelTitle = 'Mock Panel Title';
	panelDescription = 'Mock panel description';
	panelContent = '<li id="accordion-panel-mockPanelId" class="accordion-section control-section control-panel control-panel-default"> <h3 class="accordion-section-title" tabindex="0"> Fixture Panel <span class="screen-reader-text">Press return or enter to open this panel</span> </h3> <ul class="accordion-sub-container control-panel-content"> <li class="panel-meta customize-info accordion-section cannot-expand"> <button class="customize-panel-back" tabindex="-1"><span class="screen-reader-text">Back</span></button> <div class="accordion-section-title"> <span class="preview-notice">You are customizing <strong class="panel-title">Fixture Panel</strong></span> <button class="customize-help-toggle dashicons dashicons-editor-help" tabindex="0" aria-expanded="false"><span class="screen-reader-text">Help</span></button> </div> </li> </ul> </li>';
	panelData = {
		content: panelContent,
		title: panelTitle,
		description: panelDescription,
		active: true, // @todo This should default to true
		type: 'default'
	};

	mockPanel = new wp.customize.Panel( panelId, { params: panelData } );

	panelExpectedValues = {
		type: 'Panel',
		id: panelId,
		title: panelTitle,
		description: panelDescription,
		content: panelContent,
		priority: 100,
		active: true
	};

	testCustomizerModel( mockPanel, panelExpectedValues );

	test( 'Panel instance is not contextuallyActive', function () {
		equal( mockPanel.isContextuallyActive(), false );
	});

	module( 'Test wp.customize.findControlsForSettings' );
	test( 'findControlsForSettings(blogname)', function() {
		var controlsForSettings, settingId = 'fixture-setting', controlId = 'fixture-control';
		ok( wp.customize.control.has( controlId ) );
		ok( wp.customize.has( settingId ) );
		controlsForSettings = wp.customize.findControlsForSettings( [ settingId ] );
		ok( _.isObject( controlsForSettings ), 'Response is object' );
		ok( _.isArray( controlsForSettings['fixture-setting'] ), 'Response has a fixture-setting array' );
		equal( 1, controlsForSettings['fixture-setting'].length );
		equal( wp.customize.control( controlId ), controlsForSettings['fixture-setting'][0] );
	} );

	module( 'Customize Controls wp.customize.dirtyValues' );
	test( 'dirtyValues() returns expected values', function() {
		wp.customize.state( 'changesetStatus' ).set( 'auto-draft' );
		wp.customize.each( function( setting ) {
			setting._dirty = false;
		} );
		ok( _.isEmpty( wp.customize.dirtyValues() ) );
		ok( _.isEmpty( wp.customize.dirtyValues( { unsaved: false } ) ) );

		wp.customize( 'fixture-setting' )._dirty = true;
		ok( ! _.isEmpty( wp.customize.dirtyValues() ) );
		ok( _.isEmpty( wp.customize.dirtyValues( { unsaved: true } ) ) );

		wp.customize( 'fixture-setting' ).set( 'Modified' );
		ok( ! _.isEmpty( wp.customize.dirtyValues() ) );
		ok( ! _.isEmpty( wp.customize.dirtyValues( { unsaved: true } ) ) );
		equal( 'Modified', wp.customize.dirtyValues()['fixture-setting'] );

		// When the changeset does not exist, all dirty settings are necessarily unsaved.
		wp.customize.state( 'changesetStatus' ).set( '' );
		wp.customize( 'fixture-setting' )._dirty = true;
		ok( ! _.isEmpty( wp.customize.dirtyValues() ) );
		ok( ! _.isEmpty( wp.customize.dirtyValues( { unsaved: true } ) ) );
	} );

	module( 'Customize Controls: wp.customize.requestChangesetUpdate()' );
	test( 'requestChangesetUpdate makes request and returns promise', function( assert ) {
		var request, originalBeforeSetup = jQuery.ajaxSettings.beforeSend;

		jQuery.ajaxSetup( {
			beforeSend: function( e, data ) {
				var queryParams, changesetData;
				queryParams = wp.customize.utils.parseQueryString( data.data );

				assert.equal( 'customize_save', queryParams.action );
				assert.ok( ! _.isUndefined( queryParams.customize_changeset_data ) );
				assert.ok( ! _.isUndefined( queryParams.nonce ) );
				assert.ok( ! _.isUndefined( queryParams.customize_theme ) );
				assert.equal( wp.customize.settings.changeset.uuid, queryParams.customize_changeset_uuid );
				assert.equal( 'on', queryParams.wp_customize );

				changesetData = JSON.parse( queryParams.customize_changeset_data );
				assert.ok( ! _.isUndefined( changesetData.additionalSetting ) );
				assert.ok( ! _.isUndefined( changesetData['fixture-setting'] ) );

				assert.equal( 'additionalValue', changesetData.additionalSetting.value );
				assert.equal( 'requestChangesetUpdate', changesetData['fixture-setting'].value );

				// Prevent Ajax request from completing.
				return false;
			}
		} );

		wp.customize.each( function( setting ) {
			setting._dirty = false;
		} );

		request = wp.customize.requestChangesetUpdate();
		assert.equal( 'resolved', request.state());
		request.done( function( data ) {
			assert.ok( _.isEqual( {}, data ) );
		} );

		wp.customize( 'fixture-setting' ).set( 'requestChangesetUpdate' );

		request = wp.customize.requestChangesetUpdate( {
			additionalSetting: {
				value: 'additionalValue'
			}
		} );

		request.always( function( data ) {
			assert.equal( 'canceled', data.statusText );
			jQuery.ajaxSetup( { beforeSend: originalBeforeSetup } );
		} );
	} );

	module( 'Customize Utils: wp.customize.utils.getRemainingTime()' );
	test( 'utils.getRemainingTime calculates time correctly', function( assert ) {
		var datetime = '2599-08-06 12:12:13', timeRemaining, timeRemainingWithDateInstance, timeRemaingingWithTimestamp;

		timeRemaining = wp.customize.utils.getRemainingTime( datetime );
		timeRemainingWithDateInstance = wp.customize.utils.getRemainingTime( new Date( datetime.replace( /-/g, '/' ) ) );
		timeRemaingingWithTimestamp = wp.customize.utils.getRemainingTime( ( new Date( datetime.replace( /-/g, '/' ) ) ).getTime() );

		assert.equal( typeof timeRemaining, 'number', timeRemaining );
		assert.equal( typeof timeRemainingWithDateInstance, 'number', timeRemaining );
		assert.equal( typeof timeRemaingingWithTimestamp, 'number', timeRemaining );
		assert.deepEqual( timeRemaining, timeRemainingWithDateInstance );
		assert.deepEqual( timeRemaining, timeRemaingingWithTimestamp );
	});

	module( 'Customize Utils: wp.customize.utils.getCurrentTimestamp()' );
	test( 'utils.getCurrentTimestamp returns timestamp', function( assert ) {
		var currentTimeStamp;
		currentTimeStamp = wp.customize.utils.getCurrentTimestamp();
		assert.equal( typeof currentTimeStamp, 'number' );
	});

	module( 'Customize Controls: wp.customize.DateTimeControl' );
	test( 'Test DateTimeControl creation and its methods', function( assert ) {
		var control, controlId = 'date_time', section, sectionId = 'fixture-section',
			datetime = '2599-08-06 18:12:13', dateTimeArray, dateTimeArrayInampm, timeString,
			day, year, month, minute, meridian, hour;

		section = wp.customize.section( sectionId );

		control = new wp.customize.DateTimeControl( controlId, {
			params: {
				section: section.id,
				type: 'date_time',
				setting: new wp.customize.Value( datetime ),
				includeTime: true,
				content: '<li id="customize-control-' + controlId + '" class="customize-control"></li>'
			}
		} );

		wp.customize.control.add( controlId, control );

		// Test control creations.
		assert.ok( control.templateSelector, '#customize-control-date_time-content' );
		assert.ok( control.section(), sectionId );
		assert.equal( _.size( control.inputElements ), control.elements.length );
		assert.ok( control.setting(), datetime );

		day = control.inputElements.day;
		month = control.inputElements.month;
		year = control.inputElements.year;
		minute = control.inputElements.minute;
		hour = control.inputElements.hour;
		meridian = control.inputElements.meridian;

		year( '23' );
		assert.ok( control.invalidDate );

		year( '2100' );
		month( '8' );
		assert.ok( ! control.invalidDate );
		day( 'test' );
		assert.ok( control.invalidDate );
		day( '3' );
		assert.ok( ! control.invalidDate );

		// Test control.parseDateTime();
		control.params.twelveHourFormat = false;
		dateTimeArray = control.parseDateTime( datetime );
		assert.deepEqual( dateTimeArray, {
			year: '2599',
			month: '08',
			hour: '18',
			minute: '12',
			second: '13',
			day: '06'
		} );

		control.params.twelveHourFormat = true;
		dateTimeArrayInampm = control.parseDateTime( datetime );
		assert.deepEqual( dateTimeArrayInampm, {
			year: '2599',
			month: '08',
			hour: '6',
			minute: '12',
			meridian: 'pm',
			day: '06'
		} );

		year( '2010' );
		month( '12' );
		day( '18' );
		hour( '3' );
		minute( '44' );
		meridian( 'am' );

		// Test control.convertInputDateToString().
		timeString = control.convertInputDateToString();
		assert.equal( timeString, '2010-12-18 03:44:00' );

		meridian( 'pm' );
		timeString = control.convertInputDateToString();
		assert.equal( timeString, '2010-12-18 15:44:00' );

		control.params.includeTime = false;
		timeString = control.convertInputDateToString();
		assert.equal( timeString, '2010-12-18' );
		control.params.includeTime = true;

		// Test control.updateDaysForMonth();.
		year( 2017 );
		month( 2 );
		day( 28 );
		assert.ok( ! control.invalidDate );
		day( 31 );
		assert.ok( control.invalidDate );

		day( 20 );
		assert.equal( day(), 20, 'Should not update if its less the correct number of days' );

		// Test control.convertHourToTwentyFourHourFormat().
		assert.equal( control.convertHourToTwentyFourHourFormat( 11, 'pm' ), 23 );
		assert.equal( control.convertHourToTwentyFourHourFormat( 12, 'pm' ), 12 );
		assert.equal( control.convertHourToTwentyFourHourFormat( 12, 'am' ), 0 );
		assert.equal( control.convertHourToTwentyFourHourFormat( 11, 'am' ), 11 );

		// Test control.toggleFutureDateNotification().
		assert.deepEqual( control.toggleFutureDateNotification(), control );
		control.toggleFutureDateNotification( true );
		assert.ok( control.notifications.has( 'not_future_date' ) );
		control.toggleFutureDateNotification( false );
		assert.notOk( control.notifications.has( 'not_future_date' ) );

		// Test control.populateDateInputs();
		control.setting._value = '2000-12-30 12:34:56';
		control.populateDateInputs();
		assert.equal( '2000', control.inputElements.year.get() );
		assert.equal( '12', control.inputElements.month.get() );
		assert.equal( '30', control.inputElements.day.get() );
		assert.equal( '12', control.inputElements.hour.get() );
		assert.equal( '34', control.inputElements.minute.get() );
		assert.equal( 'pm', control.inputElements.meridian.get() );

		// Test control.validateInputs();
		hour( 33 );
		assert.ok( control.validateInputs() );
		hour( 10 );
		assert.notOk( control.validateInputs() );
		minute( 123 );
		assert.ok( control.validateInputs() );
		minute( 20 );
		assert.notOk( control.validateInputs() );

		// Test control.populateSetting();
		day( 2 );
		month( 11 );
		year( 2018 );
		hour( 4 );
		minute( 20 );
		meridian( 'pm' );
		control.populateSetting();
		assert.equal( control.setting(), '2018-11-02 16:20:00' );

		hour( 123 );
		control.populateSetting();
		assert.equal( control.setting(), '2018-11-02 16:20:00' ); // Should not update if invalid hour.

		hour( 5 );
		control.populateSetting();
		assert.equal( control.setting(), '2018-11-02 17:20:00' );

		// Test control.isFutureDate();
		day( 2 );
		month( 11 );
		year( 2318 );
		hour( 4 );
		minute( 20 );
		meridian( 'pm' );
		assert.ok( control.isFutureDate() );

		year( 2016 );
		assert.notOk( control.isFutureDate() );

		// Tear Down.
		wp.customize.control.remove( controlId );
	});

	module( 'Customize Sections: wp.customize.OuterSection' );
	test( 'Test OuterSection', function( assert ) {
		var section, sectionId = 'test_outer_section', body = jQuery( 'body' ),
			defaultSection, defaultSectionId = 'fixture-section';

		defaultSection = wp.customize.section( defaultSectionId );

		section = new wp.customize.OuterSection( sectionId, {
			params: {
				content: defaultSection.params.content,
				type: 'outer'
			}
		} );

		wp.customize.section.add( sectionId, section );
		wp.customize.section.add( defaultSectionId, section );

		assert.equal( section.containerPaneParent, '.customize-outer-pane-parent' );
		assert.equal( section.containerParent.selector, '#customize-outer-theme-controls' );

		defaultSection.expand();
		section.expand();
		assert.ok( body.hasClass( 'outer-section-open' ) );
		assert.ok( section.container.hasClass( 'open' ) );
		assert.ok( defaultSection.expanded() ); // Ensure it does not affect other sections state.

		section.collapse();
		assert.notOk( body.hasClass( 'outer-section-open' ) );
		assert.notOk( section.container.hasClass( 'open' ) ); // Ensure it does not affect other sections state.
		assert.ok( defaultSection.expanded() );

		// Tear down
		wp.customize.section.remove( sectionId );
	});

	module( 'Customize Controls: PreviewLinkControl' );
	test( 'Test PreviewLinkControl creation and its methods', function( assert ) {
		var section, sectionId = 'publish_settings', newLink;

		section = wp.customize.section( sectionId );
		section.deferred.embedded.resolve();

		assert.expect( 9 );
		section.deferred.embedded.done( function() {
			_.each( section.controls(), function( control ) {
				if ( 'changeset_preview_link' === control.id ) {
					assert.equal( control.templateSelector, 'customize-preview-link-control' );
					assert.equal( _.size( control.previewElements ), control.elements.length );

					// Test control.ready().
					newLink = 'http://example.org?' + wp.customize.settings.changeset.uuid;
					control.setting.set( newLink );

					assert.equal( control.previewElements.input(), newLink );
					assert.equal( control.previewElements.url(), newLink );
					assert.equal( control.previewElements.url.element.parent().attr( 'href' ), newLink );
					assert.equal( control.previewElements.url.element.parent().attr( 'target' ), wp.customize.settings.changeset.uuid );

					// Test control.toggleSaveNotification().
					control.toggleSaveNotification( true );
					assert.ok( control.notifications.has( 'changes_not_saved' ) );
					control.toggleSaveNotification( false );
					assert.notOk( control.notifications.has( 'changes_not_saved' ) );

					// Test control.updatePreviewLink().
					control.updatePreviewLink();
					assert.equal( control.setting.get(), wp.customize.previewer.getFrontendPreviewUrl() );
				}
			} );
		} );
	});
});
