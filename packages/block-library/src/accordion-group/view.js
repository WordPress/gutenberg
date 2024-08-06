/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'core/accordion', {
	state: {
		get isOpen() {
			const { isOpen, id } = getContext();
			return isOpen.includes( id );
		},
	},
	actions: {
		toggle: () => {
			const context = getContext();
			const { id, autoclose } = context;

			if ( autoclose ) {
				context.isOpen = state.isOpen ? [] : [ id ];
			} else if ( state.isOpen ) {
				context.isOpen = context.isOpen.filter(
					( item ) => item !== id
				);
			} else {
				context.isOpen.push( id );
			}
		},
	},
} );
