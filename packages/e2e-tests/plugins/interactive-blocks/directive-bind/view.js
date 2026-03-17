/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state, foo } = store( 'directive-bind', {
	state: {
		url: '/some-url',
		checked: true,
		show: false,
		width: 1,
	},
	foo: {
		bar: 1,
	},
	actions: {
		toggle: () => {
			state.url = '/some-other-url';
			state.checked = ! state.checked;
			state.show = ! state.show;
			state.width += foo.bar;
		},
		toggleValue: () => {
			const context = getContext();
			const previousValue =
				'previousValue' in context
					? context.previousValue
					: // Any string works here; we just want to toggle the value
					  // to ensure Preact renders the same we are hydrating in the
					  // first place.
					  'tacocat';

			context.previousValue = context.value;
			context.value = previousValue;
			context.count = ( context.count ?? 0 ) + 1;
		},
	},
} );
