/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'directive-on', {
	state: {
		counter: 0,
		text: '',
	},
	actions: {
		clickHandler: ( event ) => {
			state.counter += 1;
			event.target.dispatchEvent(
				new CustomEvent( 'customevent', { bubbles: true } )
			);
		},
		inputHandler: ( event ) => {
			state.text = event.target.value;
		},
		selectHandler: ( event ) => {
			const context = getContext();
			context.option = event.target.value;
		},
		customEventHandler: () => {
			const context = getContext();
			context.customEvents += 1;
		},
		setClicked: () => {
			const context = getContext();
			context.clicked = true;
		},
		countClick: () => {
			const context = getContext();
			context.clickCount += 1;
		},
		toggle: () => {
			const context = getContext();
			context.isOpen = ! context.isOpen;
		},
	},
} );
