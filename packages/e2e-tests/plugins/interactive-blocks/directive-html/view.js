import { store, asDangerousHTML } from '@wordpress/interactivity';

/** Site policy used to supply native trusted HTML to the directive. */
const policy = window.trustedTypes?.createPolicy( 'directive-html', {
	/**
	 * Returns the fixture's explicitly trusted markup.
	 *
	 * @param {string} html Fixture markup.
	 * @return {string} The same markup for the site's policy.
	 */
	createHTML: ( html ) => html,
} );

const { state } = store( 'directive-html', {
	state: {
		/** Current HTML value of the hydrated target. */
		html: null,
		/** Plain-string token target, empty until its action runs. */
		rejected: null,
		/** Empty value shared by created list items. */
		empty: null,
		/** Items created by Preact after hydration. */
		list: [ 'a', 'b' ],
		/** Readout confirming the store has hydrated. */
		hydration: 'hydrated',
	},
	actions: {
		/** Renders explicitly trusted string markup. */
		setHtml() {
			state.html = asDangerousHTML(
				'<strong data-testid="rendered-strong">Rendered HTML</strong>'
			);
		},
		/** Empties the hydrated target. */
		setLoading() {
			state.html = null;
		},
		/** Supplies an invalid non-token value. */
		setPlainString() {
			state.html = '<strong>Not rendered</strong>';
		},
		/** Renders markup from the site's Trusted Types policy. */
		setTrustedHtml() {
			state.html = asDangerousHTML( policy.createHTML( '<p>Late</p>' ) );
		},
		/** Attempts a string-token write that enforcement must reject. */
		setRejected() {
			state.rejected = asDangerousHTML( '<b>x</b>' );
		},
	},
} );
