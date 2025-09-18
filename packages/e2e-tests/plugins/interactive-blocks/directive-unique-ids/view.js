/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

store( 'directive-unique-ids', {
	state: {
		get contextResult() {
			const context = getContext();
			return JSON.stringify( {
				prop1: context.prop1,
				prop2: context.prop2,
				prop3: context.prop3,
				shared: context.shared,
				nested: context.nested,
			} );
		},
		get mergedDataResult() {
			const context = getContext();
			return JSON.stringify( context.data );
		},
	},
	actions: {
		showMergedContext() {
			// Action for testing - no console.log needed
		},
		incrementCounter() {
			const context = getContext();
			context.counter++;
		},
		increment1() {
			const context = getContext();
			context.clickCount1++;
		},
		increment2() {
			const context = getContext();
			context.clickCount2++;
		},
		showMergedData() {
			// Action for testing - no console.log needed
		},
	},
	callbacks: {
		watchCounter() {
			const context = getContext();
			context.watchCount1++;
		},
		watchCounter2() {
			const context = getContext();
			context.watchCount2++;
		},
		init1() {
			const context = getContext();
			context.init1Called = true;
		},
		init2() {
			const context = getContext();
			context.init2Called = true;
		},
		init3() {
			const context = getContext();
			context.init3Called = true;
		},
	},
} );
