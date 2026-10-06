import { store, asDangerousHTML } from '@wordpress/interactivity';

const policy = window.trustedTypes?.createPolicy( 'directive-html', {
	createHTML: ( html ) => html,
} );

const { state } = store( 'directive-html', {
	state: {
		html: null,
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
		setPlainString() {
			state.html = '<strong>Not rendered</strong>';
		},
		setTrustedHtml() {
			state.html = asDangerousHTML( policy.createHTML( '<p>Late</p>' ) );
		},
	},
} );
