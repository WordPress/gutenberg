/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'core/accordion', {
	state: {
		get isOpen() {
			const { id } = getContext();
			return state.open.includes( id );
		},
	},
	actions: {
		toggle: () => {
			const context = getContext();
			const { id, autoclose } = context;
			const itemIsOpen = state.open.includes( id );

			if ( autoclose ) {
				state.open = itemIsOpen ? [] : [ id ];
			} else if ( itemIsOpen ) {
				state.open = state.open.filter( ( item ) => item !== id );
			} else {
				state.open.push( id );
			}
		},
	},
	callbacks: {
		open: () => {
			const context = getContext();
			const { id } = context;
			context.isOpen.push( id );
		},
	},
} );
