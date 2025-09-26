/**
 * WordPress dependencies
 */
import { store, getContext, withSyncEvent } from '@wordpress/interactivity';

store( 'core/accordion', {
	state: {
		get isOpen() {
			const { id, accordionContents } = getContext();
			const accordionContent = accordionContents.find(
				( item ) => item.id === id
			);
			return accordionContent ? accordionContent.isOpen : false;
		},
	},
	actions: {
		toggle: () => {
			const context = getContext();
			const { id, autoclose, accordionContents } = context;
			const accordionContent = accordionContents.find(
				( item ) => item.id === id
			);

			if ( autoclose ) {
				accordionContents.forEach( ( item ) => {
					item.isOpen =
						item.id === id ? ! accordionContent.isOpen : false;
				} );
			} else {
				accordionContent.isOpen = ! accordionContent.isOpen;
			}
		},
		handleKeyDown: withSyncEvent( ( event ) => {
			if (
				event.key !== 'ArrowUp' &&
				event.key !== 'ArrowDown' &&
				event.key !== 'Home' &&
				event.key !== 'End'
			) {
				return;
			}

			event.preventDefault();
			const context = getContext();
			const { id, accordionContents } = context;
			const currentIndex = accordionContents.findIndex(
				( item ) => item.id === id
			);

			let nextIndex;

			switch ( event.key ) {
				case 'ArrowUp':
					nextIndex = Math.max( 0, currentIndex - 1 );
					break;
				case 'ArrowDown':
					nextIndex = Math.min(
						currentIndex + 1,
						accordionContents.length - 1
					);
					break;
				case 'Home':
					nextIndex = 0;
					break;
				case 'End':
					nextIndex = accordionContents.length - 1;
					break;
			}

			const nextId = accordionContents[ nextIndex ].id;
			const nextButton = document.getElementById( nextId );
			if ( nextButton ) {
				nextButton.focus();
			}
		} ),
	},
	callbacks: {
		initAccordionContents: () => {
			const context = getContext();
			const { id, openByDefault } = context;
			context.accordionContents.push( {
				id,
				isOpen: openByDefault,
			} );
		},
	},
} );
