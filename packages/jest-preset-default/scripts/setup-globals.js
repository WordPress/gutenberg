// These are necessary to load TinyMCE successfully
global.URL = window.URL;
global.window.tinyMCEPreInit = {
	// Without this, TinyMCE tries to determine its URL by looking at the
	// <script> tag where it was loaded from, which of course fails here.
	baseURL: 'about:blank',
};
global.window.requestAnimationFrame = setTimeout;
global.window.cancelAnimationFrame = clearTimeout;
global.window.matchMedia = () => ( {
	matches: false,
	addListener: () => {},
	removeListener: () => {},
} );

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

// Setup fake localStorage
const storage = {};
global.window.localStorage = {
	getItem: ( key ) => key in storage ? storage[ key ] : null,
	setItem: ( key, value ) => storage[ key ] = value,
};

// UserSettings global
global.window.userSettings = { uid: 1 };

// Mock jQuery
global.window.jQuery = { holdReady() {} };
