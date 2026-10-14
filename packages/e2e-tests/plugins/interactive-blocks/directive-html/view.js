import { store, asDangerousHTML } from '@wordpress/interactivity';

const { state } = store( 'directive-html', {
	state: {
		html: null,
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
	},
} );
