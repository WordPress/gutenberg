/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

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
	callbacks: {
		initIsOpen: () => {
			const context = getContext();
			const { id, openByDefault } = context;
			if ( openByDefault ) {
				context.isOpen.push( id );
			}
		},
		setTabIndex: () => {
			const { ref } = getElement();
			ref.querySelectorAll(
				'button, a, input, textarea, select, summary, iframe'
			).forEach( ( el ) => {
				el.tabIndex = state.isOpen ? 0 : -1;
			} );
		},
	},
} );
