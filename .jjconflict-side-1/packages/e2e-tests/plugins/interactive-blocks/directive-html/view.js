import { store, asDangerousHTML } from '@wordpress/interactivity';

const policy = window.trustedTypes?.createPolicy( 'directive-html', {
	createHTML: ( html ) => html,
} );

const { state } = store( 'directive-html', {
	state: {
		html: null,
		// Matches the server-rendered fallback, so it renders before the
		// rejected value replaces it.
		rejected: asDangerousHTML(
			policy?.createHTML( '<p>Rejected fallback</p>' ) ??
				'<p>Rejected fallback</p>'
		),
		empty: null,
		list: [ 'a', 'b' ],
		hydration: 'hydrated',
	},
	actions: {
		setHtml() {
			state.html = asDangerousHTML(
				'<strong data-testid="rendered-strong">Rendered HTML</strong>'
			);
		},
		setLoading() {
			state.html = null;
		},
		setTrustedHtml() {
			state.html = asDangerousHTML( policy.createHTML( '<p>Late</p>' ) );
		},
		setRejected() {
			state.rejected = asDangerousHTML( '<b>x</b>' );
		},
		setServerHtml() {
			state.serverHtml = asDangerousHTML( '<p>Client HTML</p>' );
		},
	},
} );
