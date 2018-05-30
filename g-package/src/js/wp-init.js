/**
 * External dependencies
 */
import React from 'react';
import jQuery from 'jquery';
import tinymce from 'tinymce';
import { parse, format } from 'url';
import memoize from 'memize';

window.jQuery = window.jQuery || jQuery;
window.tinymce = window.tinymce || tinymce;

window.wp = window.wp || {};
window.wp.blocks = window.wp.blocks || {};
window.wp.components = window.wp.components || {};
window.wp.element = window.wp.element || React;

window.wp.apiRequest = window.wp.apiRequest || function( options ) {
	// do something here (this should be a promise)
	return jQuery.ajax( options );
};

window.wp.url = window.wp.url || { addQueryArgs: function( url, args ) {
	const parsedURL = parse( url, true );
	const query = { ...parsedURL.query, ...args };
	delete parsedURL.search;

	return format( { ...parsedURL, query } );
} };

window.wp.shortcode = window.wp.shortcode || {};
window.wp.shortcode.regexp = window.wp.shortcode.regexp || memoize( function( tag ) {
	return new RegExp( '\\[(\\[?)(' + tag + ')(?![\\w-])([^\\]\\/]*(?:\\/(?!\\])[^\\]\\/]*)*?)(?:(\\/)\\]|\\](?:([^\\[]*(?:\\[(?!\\/\\2\\])[^\\[]*)*)(\\[\\/\\2\\]))?)(\\]?)', 'g' );
} );

window.wp.editor = window.wp.editor || {};
window.wp.editor.getDefaultSettings = window.wp.editor.getDefaultSettings || function() {
	return {
		tinymce: {
			indent: true,
			keep_styles: false,
			menubar: false,
			plugins: 'charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen',
			resize: 'vertical',
			skin: 'lightgray',
			theme: 'modern',
			toolbar1: 'bold,italic,bullist,numlist,link',
		},
		quicktags: {
			buttons: 'strong,em,link,ul,ol,li,code',
		},
	};
};

window.wp.editor.autop = window.wp.editor.autop || function() {};
window.wp.editor.getContent = window.wp.editor.getContent || function( id ) {
	const editor = window.tinymce.get( id );

	if ( editor && ! editor.isHidden() ) {
		editor.save();
	}

	return jQuery( '#' + id ).val();
};
window.wp.editor.initialize = window.wp.editor.initialize || function( id, settings = { tinymce: true } ) {
	const defaults = wp.editor.getDefaultSettings();
	const init = jQuery.extend( {}, defaults.tinymce, settings.tinymce );

	init.selector = '#' + id;

	window.tinymce.init( init );

	if ( ! window.wpActiveEditor ) {
		window.wpActiveEditor = id;
	}
};
window.wp.editor.remove = window.wp.editor.remove || function( id ) {
	const mceInstance = window.tinymce.get( id );

	if ( mceInstance ) {
		if ( ! mceInstance.isHidden() ) {
			mceInstance.save();
		}

		mceInstance.remove();
	}
};
window.wp.editor.removep = window.wp.editor.removep || function() {};

window.wp.oldEditor = window.wp.editor;

window.wp.api = window.wp.api || {};
window.wp.api.models = window.wp.api.models || {};
window.wp.api.collections = window.wp.api.collections || {};
window.wp.api.views = window.wp.api.views || {};
window.wp.api.getPostTypeRoute = window.wp.api.getPostTypeRoute || function( postType ) {
	return postType;
};

// User settings
window.userSettings = window.userSettings || {};
window.userSettings.uid = window.userSettings.uid || 1;

// Editor l10n settings
window.wpEditorL10n = window.wpEditorL10n || {
	tinymce: {
		baseUrl: 'node_modules/tinymce',
		settings: {
			external_plugins: [],
			plugins: 'charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen', // ,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview',
			toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,wp_more,spellchecker,kitchensink',
			toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
			toolbar3: '',
			toolbar4: '',
		},
		suffix: '.min',
	},
};

// API settings
window.wpApiSettings = window.wpApiSettings || {};
window.wpApiSettings.root = window.wpApiSettings.root || window.location.origin;
window.wpApiSettings.nonce = window.wpApiSettings.nonce || '123456789';
window.wpApiSettings.schema = window.wpApiSettings.schema || {};
window.wpApiSettings.schema.routes = window.wpApiSettings.schema.routes || {};
window.wpApiSettings.schema.routes[ '\/wp\/v2\/posts' ] = window.wpApiSettings.schema.routes[ '\/wp\/v2\/posts' ] || { methods: [ 'GET' ] };
window.wpApiSettings.schema.routes[ '\/wp\/v2\/posts\/(?P<id>[\\d]+)' ] = window.wpApiSettings.schema.routes[ '\/wp\/v2\/posts\/(?P<id>[\\d]+)' ] || { methods: [ 'GET' ] };
window.wpApiSettings.schema.routes[ '\/wp\/v2\/media\/(?P<id>[\\d]+)' ] = window.wpApiSettings.schema.routes[ '\/wp\/v2\/media\/(?P<id>[\\d]+)' ] || { methods: [ 'GET' ] };
