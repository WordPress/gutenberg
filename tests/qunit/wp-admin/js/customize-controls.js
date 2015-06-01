/* global wp */

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

	module( 'Customizer Setting in Fixture' );
	test( 'Setting has fixture value', function () {
		equal( wp.customize( 'fixture-setting' )(), 'Lorem Ipsum' );
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
		ok( section.container.is( '.control-section.control-section-default' ) );
		ok( 1 === section.container.find( '> .accordion-section-title' ).length );
		ok( 1 === section.container.find( '> .accordion-section-content' ).length );
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
		ok( section.container.is( '.control-section.control-section-titleless' ) );
		ok( 0 === section.container.find( '> .accordion-section-title' ).length );
		ok( 1 === section.container.find( '> .accordion-section-content' ).length );
	} );
	module( 'Customizer Custom Type Section Lacking Specific Template' );
	test( 'Fixture section has expected content', function () {
		var id = 'fixture-section-reusing-default-template', section;
		section = wp.customize.section( id );
		ok( ! section.params.content );
		ok( !! section.container );
		ok( section.container.is( '.control-section.control-section-' + section.params.type ) );
		ok( 1 === section.container.find( '> .accordion-section-title' ).length );
		ok( 1 === section.container.find( '> .accordion-section-content' ).length );
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
			instanceNumber: null,
			customizeAction: ''
		};
		jQuery.each( defaultParams, function ( key, value ) {
			ok( 'undefined' !== typeof section.params[ key ] );
			equal( value, section.params[ key ] );
		} );
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
		ok( panel.container.is( '.control-panel.control-panel-default' ) );
		ok( 1 === panel.container.find( '> .accordion-section-title' ).length );
		ok( 1 === panel.container.find( '> .control-panel-content' ).length );
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
		ok( panel.container.is( '.control-panel.control-panel-titleless' ) );
		ok( 0 === panel.container.find( '> .accordion-section-title' ).length );
		ok( 1 === panel.container.find( '> .control-panel-content' ).length );
	} );

	module( 'Customizer Custom Type Panel Lacking Specific Template' );
	test( 'Fixture panel has expected content', function () {
		var id = 'fixture-panel-reusing-default-template', panel;
		panel = wp.customize.panel( id );
		ok( ! panel.params.content );
		ok( !! panel.container );
		ok( panel.container.is( '.control-panel.control-panel-' + panel.params.type ) );
		ok( 1 === panel.container.find( '> .accordion-section-title' ).length );
		ok( 1 === panel.container.find( '> .control-panel-content' ).length );
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
			active: true,
			instanceNumber: null
		};
		jQuery.each( defaultParams, function ( key, value ) {
			ok( 'undefined' !== typeof panel.params[ key ] );
			equal( value, panel.params[ key ] );
		} );
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
	panelContent = '<li id="accordion-panel-widgets" class="control-section control-panel accordion-section">';
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
});
