import {
	store,
	getConfig,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

/**
 * Loads the images inside an element that the server made lazy because their
 * tab panel is not the one shown first.
 *
 * Such an image has no layout box while its panel is hidden, so the browser
 * never sees it coming near the viewport and would only fetch it once its tab
 * is opened. Switching it to eager fetches it straight away, hidden or not.
 *
 * @param {Element|null} element The element to look for images in.
 */
const loadLazyImages = ( element ) => {
	element
		?.querySelectorAll( 'img[data-tab-panel-lazy]' )
		.forEach( ( image ) => {
			image.loading = 'eager';
		} );
};

/**
 * Observes every Tabs block on the page, and loads the lazy images of a block
 * once it is within one viewport of being scrolled into view, so they are
 * ready by the time one of its other tabs is opened.
 *
 * @type {IntersectionObserver|undefined}
 */
let lazyImagesObserver;

const { actions, state } = store(
	'core/tabs',
	{
		state: {
			/**
			 * Gets a contextually aware list of tabs for the current tabs block.
			 *
			 * @type {Array}
			 */
			get tabsList() {
				const context = getContext();
				const tabsId = context?.tabsId;
				const tabsList = state[ tabsId ];
				return tabsList;
			},
			/**
			 * Gets the index of the active tab element whether it
			 * is a tab label or tab panel.
			 *
			 * @type {number|null}
			 */
			get tabIndex() {
				const { attributes } = getElement();
				const tabId = attributes?.id?.replace( 'tab__', '' ) || null;
				if ( ! tabId ) {
					return null;
				}
				const { tabsList } = state;
				const tabIndex = tabsList.findIndex( ( t ) => t === tabId );
				return tabIndex;
			},
			/**
			 * Whether the tab panel or tab label is the active tab.
			 *
			 * @type {boolean}
			 */
			get isActiveTab() {
				const { activeTabIndex } = getContext();
				const { tabIndex } = state;
				return activeTabIndex === tabIndex;
			},
			/**
			 * The value of the hidden attribute for tab panels.
			 *
			 * Inactive panels use the `until-found` state rather than being
			 * hidden outright, so their content stays reachable by the
			 * browser's find-in-page and by fragment navigation. The browser
			 * fires `beforematch` on the panel before revealing it, which is
			 * where the matching tab gets activated.
			 *
			 * @type {string|null}
			 */
			get isHidden() {
				return state.isActiveTab ? null : 'until-found';
			},
			/**
			 * The value of the tabindex attribute for tab buttons and tab
			 * panels. Only the active tab should be in the tab sequence.
			 *
			 * An inactive panel is hidden with `until-found`, which leaves it
			 * in the layout, so it stays focusable unless it is taken out of
			 * the tab sequence here.
			 *
			 * @type {number}
			 */
			get tabIndexAttribute() {
				return state.isActiveTab ? 0 : -1;
			},
		},
		actions: {
			/**
			 * Handles the keydown events for the tab buttons.
			 *
			 * @param {KeyboardEvent} event The keydown event.
			 */
			handleTabKeyDown: withSyncEvent( ( event ) => {
				const { tabIndex, tabsList } = state;

				if ( tabIndex === null ) {
					return;
				}

				// Swap the Left and Right arrows on RTL sites.
				const step = getConfig().isRTL ? -1 : 1;

				if ( event.key === 'ArrowRight' ) {
					event.preventDefault();
					actions.moveFocus( tabIndex + step );
				} else if ( event.key === 'ArrowLeft' ) {
					event.preventDefault();
					actions.moveFocus( tabIndex - step );
				} else if ( event.key === 'Home' ) {
					event.preventDefault();
					actions.moveFocus( 0 );
				} else if ( event.key === 'End' ) {
					event.preventDefault();
					actions.moveFocus( tabsList.length - 1 );
				}
			} ),
			/**
			 * Handles the click event for the tab label.
			 *
			 * @param {MouseEvent} event The click event.
			 */
			handleTabClick: withSyncEvent( ( event ) => {
				event.preventDefault();

				const { tabIndex } = state;
				if ( tabIndex !== null ) {
					actions.setActiveTab( tabIndex );
				}
			} ),
			/**
			 * Activates the tab whose panel the browser is about to reveal.
			 *
			 * Fired on a panel hidden with `until-found` when find-in-page or
			 * a fragment navigation matches content inside it.
			 */
			handleBeforeMatch: () => {
				const { tabIndex } = state;
				if ( tabIndex !== null ) {
					actions.setActiveTab( tabIndex );
				}
			},
			/**
			 * Moves focus to a specific tab without activating it.
			 *
			 * @param {number} tabIndex The index to move focus to.
			 */
			moveFocus: ( tabIndex ) => {
				const { tabsList } = state;

				if ( ! tabsList || tabsList.length === 0 ) {
					return;
				}

				let newIndex = tabIndex;
				if ( newIndex < 0 ) {
					newIndex = tabsList.length - 1;
				} else if ( newIndex >= tabsList.length ) {
					newIndex = 0;
				}

				const tabId = tabsList[ newIndex ];
				const tabElement = document.getElementById( 'tab__' + tabId );
				if ( tabElement ) {
					tabElement.focus();
				}
			},
			/**
			 * Sets the active tab index.
			 *
			 * @param {number}  tabIndex    The index of the active tab.
			 * @param {boolean} scrollToTab Whether to scroll to the tab element.
			 */
			setActiveTab: ( tabIndex, scrollToTab = false ) => {
				const { tabsList } = state;

				if ( ! tabsList || tabsList.length === 0 ) {
					return;
				}

				let newIndex = tabIndex;
				if ( newIndex < 0 ) {
					newIndex = 0;
				} else if ( newIndex >= tabsList.length ) {
					newIndex = tabsList.length - 1;
				}

				const context = getContext();
				context.activeTabIndex = newIndex;

				const tabId = tabsList[ newIndex ];
				const tabElement = document.getElementById( tabId );

				// The panel can be opened before the block has come near the
				// viewport, for example by a link to content inside it.
				loadLazyImages( tabElement );

				if ( scrollToTab ) {
					if ( tabElement ) {
						setTimeout( () => {
							tabElement.scrollIntoView( { behavior: 'smooth' } );
						}, 100 );
					}
				}
			},
		},
		callbacks: {
			/**
			 * Loads the lazy images of the Tabs block when it comes near the
			 * viewport.
			 *
			 * @return {(() => void)|undefined} Stops observing the Tabs block.
			 */
			loadImagesNearViewport: () => {
				const { ref } = getElement();
				if ( ! ref ) {
					return;
				}

				lazyImagesObserver ??= new window.IntersectionObserver(
					( entries ) => {
						entries.forEach( ( { isIntersecting, target } ) => {
							if ( isIntersecting ) {
								lazyImagesObserver.unobserve( target );
								loadLazyImages( target );
							}
						} );
					},
					{ rootMargin: '100%' }
				);
				lazyImagesObserver.observe( ref );

				return () => lazyImagesObserver.unobserve( ref );
			},
			activateTabByHash: () => {
				const { tabsList } = state;

				if ( ! tabsList || tabsList.length === 0 ) {
					return;
				}

				const targetElement = document.querySelector( ':target' );
				if ( ! targetElement ) {
					return;
				}

				const panelIndex = tabsList.findIndex(
					( t ) => t === targetElement.id
				);
				if ( panelIndex >= 0 ) {
					actions.setActiveTab( panelIndex, true );
					return;
				}

				// Walk up the panels containing the target rather than taking
				// the nearest one, so that nested tabs resolve to the panel
				// belonging to this block.
				let panel = targetElement.closest( '.wp-block-tab-panel' );
				let tabIndex = -1;

				while ( panel && tabIndex < 0 ) {
					tabIndex = tabsList.findIndex( ( t ) => t === panel.id );
					panel =
						panel.parentElement?.closest( '.wp-block-tab-panel' ) ??
						null;
				}

				if ( tabIndex < 0 ) {
					return;
				}

				actions.setActiveTab( tabIndex );
				window.setTimeout( () => {
					targetElement.scrollIntoView();
				}, 0 );
			},
		},
	},
	{
		lock: true,
	}
);
