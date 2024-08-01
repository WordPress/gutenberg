/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

store( 'core/accordion', {
	state: {
		get isOpen() {
			const { isOpen, id } = getContext();
			return isOpen.includes( id );
		},
	},
	actions: {
		toggle: () => {
			const context = getContext();
			const { id, isOpen, autoclose } = context;
			const itemIsOpen = isOpen.includes( id );
			if ( autoclose ) {
				context.isOpen = itemIsOpen ? [] : [ id ];
			} else if ( itemIsOpen ) {
				context.isOpen = isOpen.filter( ( item ) => item !== id );
			} else {
				context.isOpen = [ ...isOpen, id ];
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
