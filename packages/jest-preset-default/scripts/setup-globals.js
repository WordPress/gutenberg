// These are necessary to load TinyMCE successfully
global.URL = window.URL;
global.window.tinyMCEPreInit = {
	// Without this, TinyMCE tries to determine its URL by looking at the
	// <script> tag where it was loaded from, which of course fails here.
	baseURL: 'about:blank',
};
global.window.requestAnimationFrame = ( callback ) =>
	setTimeout( () => callback( Date.now() ) );
global.window.cancelAnimationFrame = clearTimeout;
global.window.matchMedia = () => ( {
	matches: false,
	addListener: () => {},
	removeListener: () => {},
} );
// Mock window.getSelection.
global.window.getSelection = jest.fn( () => ( {
	addRange: jest.fn(),
	removeAllRanges: jest.fn(),
} ) );

// Setup fake localStorage
const storage = {};
global.window.localStorage = {
	getItem: ( key ) => ( key in storage ? storage[ key ] : null ),
	setItem: ( key, value ) => ( storage[ key ] = value ),
};

// UserSettings global
global.window.userSettings = { uid: 1 };
