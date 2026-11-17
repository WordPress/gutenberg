( function () {
	const { createReduxStore, register, select } = wp.data;
	const { addFilter } = wp.hooks;
	const { map, language } = window.navigationOverlayViewportsLocale;

	// Holds the language being edited. A multilingual plugin usually has a
	// store like this already.
	const store = createReduxStore(
		'gutenberg-test/navigation-overlay-viewports-locale',
		{
			reducer( state = { language }, action ) {
				if ( action.type === 'SET_LANGUAGE' ) {
					return { ...state, language: action.language };
				}
				return state;
			},
			actions: {
				setLanguage( newLanguage ) {
					return { type: 'SET_LANGUAGE', language: newLanguage };
				},
			},
			selectors: {
				getLanguage( state ) {
					return state.language;
				},
			},
		}
	);
	register( store );

	// Matches the PHP filter, so the editor shows the overlay where the front
	// end does. The block applies this filter inside `useSelect`, so reading
	// the language with `select()` re-renders the block when it changes.
	addFilter(
		'blocks.navigation.overlayViewports',
		'gutenberg-test/navigation-overlay-viewports-locale',
		( overlayViewports ) => {
			const currentLanguage = select( store ).getLanguage();
			return Object.hasOwn( map, currentLanguage )
				? map[ currentLanguage ]
				: overlayViewports;
		}
	);
} )();
