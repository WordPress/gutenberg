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
		/** Items covering null, invalid, and explicitly trusted values. */
		valueItems: [],
		/** Items bound to an element with no fallback content. */
		emptyItems: [],
		/** Values matching the server-rendered items and one new item. */
		hydrationList: [
			{ html: serverHTML },
			{ html: serverHTML },
			{ html: serverHTML },
		],
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
		/** Adds null, invalid-string, and trusted-token values for enforcement. */
		addValueItems() {
			state.valueItems = [
				{ html: null },
				{ html: '<b>x</b>' },
				{
					html: asDangerousHTML( policy.createHTML( '<b>t</b>' ) ),
				},
			];
		},
		/** Adds a representation to the list with an empty template fallback. */
		addEmptyItem() {
			state.emptyItems.push( { html: serverHTML } );
		},
		/** Replaces the first displayed fallback with a rejected plain-string token. */
		rejectFirstItem() {
			state.fallbackItems[ 0 ].html = asDangerousHTML( '<b>x</b>' );
		},
		/** Adds a token that enforcement rejects at element creation. */
		addRejectedItem() {
			state.fallbackItems.push( {
				id: ++itemId,
				html: asDangerousHTML( '<b>y</b>' ),
			} );
		},
		/** Resolves the list whose server value stayed pending through hydration. */
		resolvePendingList() {
			store( 'directive-html', {
				state: {
					/** Supplies two server-representation items after hydration. */
					get pendingHydrationList() {
						return [ { html: serverHTML }, { html: serverHTML } ];
					},
				},
			} );
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
