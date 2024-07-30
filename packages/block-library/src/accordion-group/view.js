/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/* eslint-disable-next-line no-unused-vars */
const { state, actions } = store( 'core/accordion', {
	state: {
		get isOpen() {
			const { attributes } = getElement();
			const id =
				attributes.id ||
				attributes[ 'aria-controls' ] ||
				attributes[ 'aria-labelledby' ];
			const context = getContext();
			return context.isOpen.includes( id );
		},
	},
	actions: {
		toggle: () => {
			const { attributes } = getElement();
			const id = attributes[ 'aria-controls' ];
			const context = getContext();
			if ( context.isOpen.includes( id ) ) {
				if ( context.autoclose ) {
					context.isOpen = [];
				} else {
					context.isOpen = context.isOpen.filter(
						( item ) => item !== id
					);
				}
			} else if ( context.autoclose ) {
				context.isOpen = [ id ];
			} else {
				context.isOpen = [ ...context.isOpen, id ];
			}
		},
	},
	callbacks: {
		open: () => {
			const context = getContext();
			const { ref } = getElement();
			context.isOpen.push( ref.id );
		},
	},
} );
