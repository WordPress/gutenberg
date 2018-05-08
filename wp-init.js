/**
 * External dependencies
 */
import React from 'react';
import jQuery from 'jquery';
import moment from 'moment';
import { parse, format } from 'url';

window.jQuery = window.jQuery || jQuery;

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

// Date settings
window._wpDateSettings = window._wpDateSettings || {};
window._wpDateSettings.l10n = window._wpDateSettings.l10n || {};
window._wpDateSettings.l10n.locale = window._wpDateSettings.l10n.locale || 'en_US';

moment.locale( window._wpDateSettings.l10n.locale );
const localeData = moment.localeData();

window._wpDateSettings.l10n.months = window._wpDateSettings.l10n.months || localeData.months();
window._wpDateSettings.l10n.monthsShort = window._wpDateSettings.l10n.monthsShort || localeData.monthsShort();
window._wpDateSettings.l10n.weekdays = window._wpDateSettings.l10n.weekdays || localeData.weekdays();
window._wpDateSettings.l10n.weekdaysShort = window._wpDateSettings.l10n.weekdaysShort || localeData.weekdaysShort();
window._wpDateSettings.l10n.meridiem = window._wpDateSettings.l10n.meridiem || { am: 'am', pm: 'pm', AM: 'AM', PM: 'PM' };
window._wpDateSettings.l10n.relative = window._wpDateSettings.l10n.relative || {
	future: 'in %s',
	past: '%s ago',
	s: 'a few seconds',
	ss: '%d seconds',
	m: 'a minute',
	mm: '%d minutes',
	h: 'an hour',
	hh: '%d hours',
	d: 'a day',
	dd: '%d days',
	M: 'a month',
	MM: '%d months',
	y: 'a year',
	yy: '%d years',
};

window._wpDateSettings.formats = window._wpDateSettings.formats || { time: 'G:i', date: 'j F, Y', datetime: 'j F, Y G:i' };
window._wpDateSettings.timezone = window._wpDateSettings.timezone || { offset: '0', string: '' };

// Editor l10n settings
window.wpEditorL10n = window.wpEditorL10n || {
	tinymce: {
		baseUrl: 'node_modules/tinymce',
		settings: {
			external_plugins: [],
			plugins: 'charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview',
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
