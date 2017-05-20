/* globals wp */
/* jshint qunit: true */
/* eslint-env qunit */
/* eslint-disable no-magic-numbers */

( function() {
	'use strict';

	module( 'Video Media Widget' );

	test( 'video widget control', function() {
		var VideoWidgetControl, videoWidgetControlInstance, videoWidgetModelInstance, mappedProps, testVideoUrl;
		testVideoUrl = 'https://videos.files.wordpress.com/AHz0Ca46/wp4-7-vaughan-r8-mastered_hd.mp4';
		equal( typeof wp.mediaWidgets.controlConstructors.media_video, 'function', 'wp.mediaWidgets.controlConstructors.media_video is a function' );
		VideoWidgetControl = wp.mediaWidgets.controlConstructors.media_video;
		ok( VideoWidgetControl.prototype instanceof wp.mediaWidgets.MediaWidgetControl, 'wp.mediaWidgets.controlConstructors.media_video subclasses wp.mediaWidgets.MediaWidgetControl' );

		videoWidgetModelInstance = new wp.mediaWidgets.modelConstructors.media_video();
		videoWidgetControlInstance = new VideoWidgetControl({
			model: videoWidgetModelInstance
		});

		// Test mapModelToMediaFrameProps().
		videoWidgetControlInstance.model.set({ error: false, url: testVideoUrl, loop: false, preload: 'meta' });
		mappedProps = videoWidgetControlInstance.mapModelToMediaFrameProps( videoWidgetControlInstance.model.toJSON() );
		equal( mappedProps.url, testVideoUrl, 'mapModelToMediaFrameProps should set url' );
		equal( mappedProps.loop, false, 'mapModelToMediaFrameProps should set loop' );
		equal( mappedProps.preload, 'meta', 'mapModelToMediaFrameProps should set preload' );

		// Test mapMediaToModelProps().
		mappedProps = videoWidgetControlInstance.mapMediaToModelProps( { loop: false, preload: 'meta', url: testVideoUrl, title: 'random movie file title' } );
		equal( mappedProps.title, undefined, 'mapMediaToModelProps should ignore title inputs' );
		equal( mappedProps.loop, false, 'mapMediaToModelProps should set loop' );
		equal( mappedProps.preload, 'meta', 'mapMediaToModelProps should set preload' );

		// Test isHostedVideo().
		equal( videoWidgetControlInstance.isHostedVideo( 'https://www.youtube.com/watch?v=OQSNhk5ICTI' ), true, 'isHostedVideo should return true for full YouTube url.' );
		equal( videoWidgetControlInstance.isHostedVideo( 'https://youtu.be/OQSNhk5ICTI' ), true, 'isHostedVideo should return true for shortened youtube url' );
		equal( videoWidgetControlInstance.isHostedVideo( 'https://vimeo.com/190372437' ), true, 'isHostedVideo should return true for vimeo url.' );
		equal( videoWidgetControlInstance.isHostedVideo( 'https://wordpress.org/' ), false, 'isHostedVideo should return false for non-supported video url.' );
	});

	test( 'video widget control renderPreview', function( assert ) {
		var videoWidgetControlInstance, videoWidgetModelInstance, done;
		done = assert.async();

		videoWidgetModelInstance = new wp.mediaWidgets.modelConstructors.media_video();
		videoWidgetControlInstance = new wp.mediaWidgets.controlConstructors.media_video({
			model: videoWidgetModelInstance
		});
		equal( videoWidgetControlInstance.$el.find( 'a' ).length, 0, 'No video links should be rendered' );
		videoWidgetControlInstance.model.set({ error: false, url: 'https://videos.files.wordpress.com/AHz0Ca46/wp4-7-vaughan-r8-mastered_hd.mp4' });

		// Due to renderPreview being deferred.
		setTimeout( function() {
			equal( videoWidgetControlInstance.$el.find( 'a[href="https://videos.files.wordpress.com/AHz0Ca46/wp4-7-vaughan-r8-mastered_hd.mp4"]' ).length, 1, 'One video link should be rendered' );
			done();
		}, 50 );
		start();
	});

	test( 'video media model', function() {
		var VideoWidgetModel, videoWidgetModelInstance;
		equal( typeof wp.mediaWidgets.modelConstructors.media_video, 'function', 'wp.mediaWidgets.modelConstructors.media_video is a function' );
		VideoWidgetModel = wp.mediaWidgets.modelConstructors.media_video;
		ok( VideoWidgetModel.prototype instanceof wp.mediaWidgets.MediaWidgetModel, 'wp.mediaWidgets.modelConstructors.media_video subclasses wp.mediaWidgets.MediaWidgetModel' );

		videoWidgetModelInstance = new VideoWidgetModel();
		_.each( videoWidgetModelInstance.attributes, function( value, key ) {
			equal( value, VideoWidgetModel.prototype.schema[ key ][ 'default' ], 'Should properly set default for ' + key );
		});
	});

})();
