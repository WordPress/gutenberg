// Mock `matchMedia` so that all animations are skipped,
// since js-dom does not fully support CSS animations.
// Example: https://github.com/jsdom/jsdom/issues/3239
const originalMatchMedia = window.matchMedia;
const mockedMatchMedia = jest.fn( ( query ) => {
	if ( /prefers-reduced-motion/.test( query ) ) {
		return {
			...originalMatchMedia( query ),
			matches: true,
		};
	}

	return originalMatchMedia( query );
} );

beforeAll( () => {
	window.matchMedia = jest.fn( mockedMatchMedia );
} );

afterAll( () => {
	window.matchMedia = originalMatchMedia;
} );
