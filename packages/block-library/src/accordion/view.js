import { store, getContext } from '@wordpress/interactivity';

// Whether the hash has been handled for the current page load.
// This is used to prevent the hash from being handled multiple times.
let hashHandled = false;

const { state, actions } = store(
	'core/accordion',
	{
		state: {
			get isOpen() {
				const { id, accordionItems, openByDefault } = getContext();
				const accordionItem = accordionItems.find(
					( item ) => item.id === id
				);
				// Until the item registers itself on init, fall back to the
				// initial state so hydration matches the server-rendered
				// markup and no layout shift occurs.
				return accordionItem ? accordionItem.isOpen : openByDefault;
			},
			get isHidden() {
				return state.isOpen ? null : 'until-found';
			},
		},
		actions: {
			toggle: () => {
				const context = getContext();
				const { id, autoclose, accordionItems } = context;
				const accordionItem = accordionItems.find(
					( item ) => item.id === id
				);

				if ( autoclose ) {
					accordionItems.forEach( ( item ) => {
						item.isOpen =
							item.id === id ? ! accordionItem.isOpen : false;
					} );
				} else {
					accordionItem.isOpen = ! accordionItem.isOpen;
				}
			},
			openPanelByHash: () => {
				if ( hashHandled ) {
					return;
				}

				const context = getContext();
				const { id, accordionItems, autoclose } = context;
				const targetElement = document.querySelector( ':target' );

				if ( ! targetElement ) {
					return;
				}

				const panelElement = window.document.querySelector(
					'.wp-block-accordion-panel[aria-labelledby="' + id + '"]'
				);

				if (
					! panelElement ||
					! panelElement.contains( targetElement )
				) {
					return;
				}

				hashHandled = true;

				if ( autoclose ) {
					accordionItems.forEach( ( item ) => {
						item.isOpen = item.id === id;
					} );
				} else {
					const targetItem = accordionItems.find(
						( item ) => item.id === id
					);

					if ( targetItem ) {
						targetItem.isOpen = true;
					}
				}

				// Wait for the panel to be opened before scrolling to it.
				window.setTimeout( () => {
					targetElement.scrollIntoView();
				}, 0 );
			},
			handleBeforeMatch: () => {
				const context = getContext();
				const { id, autoclose, accordionItems } = context;
				const accordionItem = accordionItems.find(
					( item ) => item.id === id
				);

				if ( accordionItem ) {
					if ( autoclose ) {
						accordionItems.forEach( ( item ) => {
							item.isOpen = item.id === id;
						} );
					} else {
						accordionItem.isOpen = true;
					}
				}
			},
		},
		callbacks: {
			initAccordionItems: () => {
				const context = getContext();
				const { id, openByDefault, accordionItems } = context;
				accordionItems.push( {
					id,
					isOpen: openByDefault,
				} );
				actions.openPanelByHash();
			},
			hashChange: () => {
				hashHandled = false;
				actions.openPanelByHash();
			},
		},
	},
	{ lock: true }
);
