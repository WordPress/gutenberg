/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getServerContext,
	withSyncEvent,
} from '@wordpress/interactivity';

store( 'test/get-server-context', {
	actions: {
		navigate: withSyncEvent( function* ( e ) {
			e.preventDefault();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href );
		} ),
		attemptModification() {
			try {
				getServerContext().prop = 'updated from client';
				getContext().result = 'unexpectedly modified ❌';
			} catch ( e ) {
				getContext().result = 'not modified ✅';
			}
		},
		updateNonChanging() {
			getContext().nonChanging = 'modified from client';
		},
	},
	callbacks: {
		updateServerContextParent() {
			const ctx = getContext();
			const { prop, newProp, nested, inherited } = getServerContext();
			ctx.prop = prop;
			if ( newProp ) {
				ctx.newProp = newProp;
			}
			ctx.nested.prop = nested.prop;
			if ( nested?.newProp ) {
				ctx.nested.newProp = nested.newProp;
			}
			ctx.inherited.prop = inherited.prop;
			if ( inherited?.newProp ) {
				ctx.inherited.newProp = inherited.newProp;
			}
		},
		updateServerContextChild() {
			const ctx = getContext();
			const { prop, newProp, nested, inherited } = getServerContext();
			ctx.prop = prop;
			if ( newProp ) {
				ctx.newProp = newProp;
			}
			ctx.nested.prop = nested.prop;
			if ( nested?.newProp ) {
				ctx.nested.newProp = nested.newProp;
			}
			ctx.inherited.prop = inherited.prop;
			if ( inherited?.newProp ) {
				ctx.inherited.newProp = inherited.newProp;
			}
		},
		updateNonChanging() {
			// This property never changes in the server, but it changes in the
			// client so every time there's a navigation, we need to overwrite
			// it.
			const ctx = getContext();
			const { nonChanging } = getServerContext();
			ctx.nonChanging = nonChanging;
		},
		updateOnlyInMain() {
			// This property only exists in the main page, so we need to clear
			// it when navigating to a page that doesn't have it.
			const ctx = getContext();
			const { onlyInMain } = getServerContext();
			ctx.onlyInMain = onlyInMain;
		},
		updateOnlyInModified() {
			// This property only exists in the modified page, so we need to clear
			// it when navigating to a page that doesn't have it.
			const ctx = getContext();
			const { onlyInModified } = getServerContext();
			ctx.onlyInModified = onlyInModified;
		},
	},
} );
