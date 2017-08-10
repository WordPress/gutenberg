// Turn various warnings into errors
/* eslint-disable no-console */
console._errorOriginal = console.error;
console.error = ( ...args ) => {
	const util = require( 'util' );
	throw new Error(
		'Warning caught via console.error: ' +
		util.format.apply( util, args )
	);
};
/* eslint-enable no-console */

// These are necessary to load TinyMCE successfully
global.URL = window.URL;
global.window.tinyMCEPreInit = {
	// Without this, TinyMCE tries to determine its URL by looking at the
	// <script> tag where it was loaded from, which of course fails here.
	baseURL: 'about:blank',
};
window.requestAnimationFrame = setTimeout;
window.cancelAnimationFrame = clearTimeout;

global.window._wpDateSettings = {
	formats: {
		date: 'j F Y',
		datetime: 'j F Y G \h i \m\i\n',
		time: 'G \h i \m\i\n',
	},
	l10n: {
		locale: 'en',
		meridiem: {
			am: 'am',
			AM: 'AM',
			pm: 'pm',
			PM: 'PM',
		},
		months: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
		monthsShort: [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
		weekdays: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
		weekdaysShort: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
		relative: {
			future: '%s from now',
			past: '%s ago',
		},
	},
	timezone: {
		offset: '-5',
		string: 'America/New_York',
	},
};

global.wp = global.wp || {};
global.wp.a11y = {
	speak: () => {},
};
