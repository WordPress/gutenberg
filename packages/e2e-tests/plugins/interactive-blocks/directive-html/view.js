import { store, asDangerousHTML } from '@wordpress/interactivity';

const policy = window.trustedTypes?.createPolicy( 'directive-html', {
	createHTML: ( html ) => html,
} );

// Matches the server's token representation for fallback creation cases.
const serverHTML = { wpServerHtml: true };
// Supplies unique item IDs for the created list items.
let itemId = 0;

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
		/** Items whose individual values are server HTML representations. */
		fallbackItems: [],
		/** Items bound to the client getter registered by the fixture. */
		lazyItems: [],
		/** Items whose fallback contains an inert script fixture. */
		scriptItems: [],
	},
	actions: {
		/** Adds one item whose pending representation should show its fallback. */
		addFallback() {
			state.fallbackItems.push( {
				id: ++itemId,
				html: serverHTML,
			} );
		},
		/** Adds two fallback items in the same reactive update. */
		addTwoFallbacks() {
			state.fallbackItems.push(
				{ id: ++itemId, html: serverHTML },
				{ id: ++itemId, html: serverHTML }
			);
		},
		/** Adds an item whose value remains pending until its getter is registered. */
		addLazyItem() {
			state.lazyItems.push( { id: ++itemId } );
		},
		/** Registers the late trusted HTML getter for the pending item. */
		registerLazy() {
			store( 'directive-html', {
				state: {
					/** Resolves the pending value to trusted markup. */
					get lazy() {
						return asDangerousHTML(
							policy.createHTML( '<b>Late</b>' )
						);
					},
				},
			} );
		},
		/** Adds two items whose fallback includes a script that must stay inert. */
		addScriptItems() {
			state.scriptItems.push(
				{ id: ++itemId, html: serverHTML },
				{ id: ++itemId, html: serverHTML }
			);
		},
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
