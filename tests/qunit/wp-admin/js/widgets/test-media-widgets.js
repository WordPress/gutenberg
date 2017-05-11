/* globals wp, Backbone */
/* jshint qunit: true */
/* eslint-env qunit */

(function() {
	'use strict';

	module( 'Media Widgets' );

	test( 'namespace', function() {
		equal( typeof wp.mediaWidgets, 'object', 'wp.mediaWidgets is an object' );
		equal( typeof wp.mediaWidgets.controlConstructors, 'object', 'wp.mediaWidgets.controlConstructors is an object' );
		equal( typeof wp.mediaWidgets.modelConstructors, 'object', 'wp.mediaWidgets.modelConstructors is an object' );
		equal( typeof wp.mediaWidgets.widgetControls, 'object', 'wp.mediaWidgets.widgetControls is an object' );
		equal( typeof wp.mediaWidgets.handleWidgetAdded, 'function', 'wp.mediaWidgets.handleWidgetAdded is an function' );
		equal( typeof wp.mediaWidgets.handleWidgetUpdated, 'function', 'wp.mediaWidgets.handleWidgetUpdated is an function' );
		equal( typeof wp.mediaWidgets.init, 'function', 'wp.mediaWidgets.init is an function' );
	});

	test( 'media widget control', function() {
		equal( typeof wp.mediaWidgets.MediaWidgetControl, 'function', 'wp.mediaWidgets.MediaWidgetControl' );
		ok( wp.mediaWidgets.MediaWidgetControl.prototype instanceof Backbone.View, 'wp.mediaWidgets.MediaWidgetControl subclasses Backbone.View' );
	});

	test( 'media widget model', function() {
		var widgetModelInstance;
		equal( typeof wp.mediaWidgets.MediaWidgetModel, 'function', 'wp.mediaWidgets.MediaWidgetModel is a function' );
		ok( wp.mediaWidgets.MediaWidgetModel.prototype instanceof Backbone.Model, 'wp.mediaWidgets.MediaWidgetModel subclasses Backbone.Model' );

		widgetModelInstance = new wp.mediaWidgets.MediaWidgetModel();
		equal( widgetModelInstance.get( 'title' ), '', 'wp.mediaWidgets.MediaWidgetModel defaults title to empty string' );
		equal( widgetModelInstance.get( 'attachment_id' ), 0, 'wp.mediaWidgets.MediaWidgetModel defaults attachment_id to 0' );
		equal( widgetModelInstance.get( 'url' ), 0, 'wp.mediaWidgets.MediaWidgetModel defaults url to empty string' );

		widgetModelInstance.set({
			title: 'chicken and ribs',
			attachment_id: '1',
			url: 'https://wordpress.org'
		});
		equal( widgetModelInstance.get( 'title' ), 'chicken and ribs', 'wp.mediaWidgets.MediaWidgetModel properly sets the title attribute' );
		equal( widgetModelInstance.get( 'url' ), 'https://wordpress.org', 'wp.mediaWidgets.MediaWidgetModel properly sets the url attribute' );
		equal( widgetModelInstance.get( 'attachment_id' ), 1, 'wp.mediaWidgets.MediaWidgetModel properly sets and casts the attachment_id attribute' );
	});

})();
