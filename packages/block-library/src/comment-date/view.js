/**
 * Internal dependencies
 */
import './runtime/init.js';
import { store } from './runtime';
import { __, _n, sprintf } from '@wordpress/i18n';

( function ( domain, translations ) {
	var localeData =
		translations.locale_data[ domain ] || translations.locale_data.messages;
	localeData[ '' ].domain = domain;
	wp.i18n.setLocaleData( localeData, domain );
} )( 'default', {
	'translation-revision-date': '2023-03-07 19:10:38+0000',
	generator: 'GlotPress/4.0.0-alpha.4',
	domain: 'messages',
	locale_data: {
		messages: {
			'': {
				domain: 'messages',
				'plural-forms':
					'nplurals=3; plural=(n == 1) ? 0 : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 1 : 2);',
				lang: 'pl',
			},
			'Hello world!': [ 'Witaj swiecie' ],
			'%s second ago': [
				'%s sekunde temu',
				'%s sekundy temu',
				'%s sekund temu',
			],
			'%s minute ago': [
				'%s minute temu',
				'%s minuty temu',
				'%s minut temu',
			],
			'%s hour ago': [
				'%s godzine temu',
				'%s godziny temu',
				'%s godzin temu',
			],
			'%s day ago': [ '%s dzien temu', '%s dni temu', '%s dni temu' ],
			'%s month ago': [
				'%s miesiac temu',
				'%s miesiace temu',
				'%s miesiecy temu',
			],
			'%s year ago': [ '%s rok temu', '%s lata temu', '%s lat temu' ],
		},
	},
	comment: {
		reference: 'wp-includes/js/wp-auth-check.js',
	},
} );

function makeTheUpdate( context ) {
	const secondsDiff = Math.max(
		Math.round( ( new Date() - new Date( context.commentDate ) ) / 1000 ),
		1
	);

	if ( secondsDiff < 60 ) {
		// Seconds
		context.commentsDateDiff = sprintf(
			_n( '%s second ago', '%s seconds ago', secondsDiff ),
			secondsDiff
		);
		setTimeout( () => {
			makeTheUpdate( context );
		}, 1000 );
	} else if ( secondsDiff < 3600 ) {
		// Minutes
		const minutesDiff = Math.round( secondsDiff / 60 );
		context.commentsDateDiff = sprintf(
			_n( '%s minute ago', '%s minutes ago', minutesDiff ),
			minutesDiff
		);
		setTimeout( () => {
			makeTheUpdate( context );
		}, 60 * 1000 );
	} else if ( secondsDiff < 3600 * 24 ) {
		const hoursDiff = Math.round( secondsDiff / 3600 );
		context.commentsDateDiff = sprintf(
			_n( '%s hour ago', '%s hours ago', hoursDiff ),
			hoursDiff
		);
	} else if ( secondsDiff < 3600 * 24 * 30 ) {
		const daysDiff = Math.round( secondsDiff / ( 3600 * 24 ) );
		context.commentsDateDiff = sprintf(
			_n( '%s day ago', '%s days ago', daysDiff ),
			daysDiff
		);
	} else if ( secondsDiff < 3600 * 24 * 365 ) {
		const monthsDiff = Math.round( secondsDiff / ( 3600 * 24 * 30 ) );
		context.commentsDateDiff = sprintf(
			_n( '%s month ago', '%s months ago', monthsDiff ),
			monthsDiff
		);
	} else {
		const yearDiff = Math.round( secondsDiff / ( 3600 * 24 * 365 ) );
		context.commentsDateDiff = sprintf(
			_n( '%s year ago', '%s years ago', yearDiff ),
			yearDiff
		);
	}
}

store( {
	effects: {
		core: {
			checkDiff: ( { context } ) => {
				makeTheUpdate( context );
			},
		},
	},
} );
