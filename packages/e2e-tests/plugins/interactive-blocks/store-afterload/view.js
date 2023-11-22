( ( { wp } ) => {
	/**
	 * WordPress dependencies
	 */
	const { store } = wp.interactivity;

	const afterLoad = ({ state }) => {
		// Check the state is correctly initialized.
		const { status1, status2, status3, status4 } = state;
		state.allStoresReady =
			[ status1, status2, status3, status4 ]
				.every( ( t ) => t === 'ready' )
				.toString();

		// Check the HTML has been processed as well.
		const selector = '[data-store-status]';
		state.vdomReady =
			document.querySelector( selector ) &&
				Array.from(
					document.querySelectorAll( selector )
				).every( ( el ) => el.textContent === 'ready' ).toString();

		// Increment exec times everytime this function runs.
		state.execTimes.afterLoad += 1;
	}

	const sharedAfterLoad = ({ state }) => {
		// Increment exec times everytime this function runs.
		state.execTimes.sharedAfterLoad += 1;
	}

	// Case 1: without afterload callback
	store( {
		state: { status1: 'ready' },
	} );

	// Case 2: non-shared afterload callback
	store( {
		state: {
			status2: 'ready',
			allStoresReady: false,
			vdomReady: false,
			execTimes: { afterLoad: 0 },
		},
	}, { afterLoad } );

	// Case 3: shared afterload callback
	store( {
		state: {
			status3: 'ready',
			execTimes: { sharedAfterLoad: 0 },
		},
	}, { afterLoad: sharedAfterLoad }  );
	store( {
		state: {
			status4: 'ready',
			execTimes: { sharedAfterLoad: 0 },
		},
	}, { afterLoad: sharedAfterLoad }  );
} )( window );
