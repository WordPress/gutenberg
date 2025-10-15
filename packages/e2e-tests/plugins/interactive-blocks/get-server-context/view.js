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
			ctx.newProp = newProp;
			ctx.nested.prop = nested.prop;
			ctx.nested.newProp = nested.newProp;
			ctx.inherited.prop = inherited.prop;
			ctx.inherited.newProp = inherited.newProp;
		},
		updateServerContextChild() {
			const ctx = getContext();
			const { prop, newProp, nested, inherited } = getServerContext();
			ctx.prop = prop;
			ctx.newProp = newProp;
			ctx.nested.prop = nested.prop;
			ctx.nested.newProp = nested.newProp;
			ctx.inherited.prop = inherited.prop;
			ctx.inherited.newProp = inherited.newProp;
		},
		updateNonChanging() {
			// This property never changes in the server, but it changes in the
			// client so every time there's a navigation, we need to overwrite
			// it.
			const ctx = getContext();
			const { nonChanging } = getServerContext();
			ctx.nonChanging = nonChanging;
		},
	},
} );
