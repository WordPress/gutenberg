// Chai plugins
require( 'chai' )
	.use( require( 'dirty-chai' ) )
	.use( require( 'sinon-chai' ) );

// Sinon plugins
const sinon = require( 'sinon' );
const sinonTest = require( 'sinon-test' );
sinon.test = sinonTest.configureTest( sinon );
sinon.testCase = sinonTest.configureTestCase( sinon );

// Fake DOM
const { JSDOM } = require( 'jsdom' );
const dom = new JSDOM( '', {
	features: {
		FetchExternalResources: false,
		ProcessExternalResources: false,
		SkipExternalResources: true,
	},
} );

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.requestAnimationFrame = window.setTimeout;

// These are necessary to load TinyMCE successfully
global.URL = window.URL;
global.window.tinyMCEPreInit = {
	// Without this, TinyMCE tries to determine its URL by looking at the
	// <script> tag where it was loaded from, which of course fails here.
	baseURL: 'about:blank',
};

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
