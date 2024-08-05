/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Determines whether a value is numeric.
 *
 * @param {*} value A vlue to check.
 * @return {boolean} Whether the value is numeric.
 */
function isNumeric( value ) {
	return ! isNaN( parseFloat( value ) );
}

/**
 * Generates a map of tab panel IDs to tab label IDs.
 *
 * @param {Element[]} tabLabels List of tab label elements.
 * @return {Map} A map of tab panel IDs to tab label IDs.
 */
function getTabPanelToLabelIdMap( tabLabels ) {
	if ( ! tabLabels ) {
		return new Map();
	}

	return new Map(
		tabLabels.map( ( tabLabel ) => {
			const tabPanelId = tabLabel.getAttribute( 'href' )?.substring( 1 );
			const tabLabelId = tabLabel.getAttribute( 'id' );
			return [ tabPanelId, tabLabelId ];
		} )
	);
}

/**
 * Initializes the tabs block with the necessary ARIA attributes.
 *
 * @param {HTMLElement} ref The block wrapper element.
 */
function initTabs( ref ) {
	// Add class interactive to the block wrapper to indicate JavaScript has been loaded.
	ref.classList.add( 'interactive' );

	const tabList = ref.querySelector( '.wp-block-tabs__list' );
	if ( tabList ) {
		// Add role="tablist" to the <ul> element.
		tabList.setAttribute( 'role', 'tablist' );

		// Use the hidden <h3>Contents</h3> element as the label for the tab list, if found.
		const tabListLabel = ref.querySelector( '.wp-block-tabs__title' );
		if ( tabListLabel ) {
			const tabListLabelId = tabListLabel.id || 'tablist-label';
			tabListLabel.id = tabListLabelId;
			tabList.setAttribute( 'aria-labelledby', tabListLabelId );
		} else {
			tabList.setAttribute( 'aria-label', 'Tabs' );
		}
	}

	// Add role="presentation" to each <li> element, because the inner <a> elements are the actual tabs.
	const tabItems = Array.from(
		ref.querySelectorAll( '.wp-block-tabs__list-item' )
	);
	tabItems.forEach( ( item ) => {
		item.setAttribute( 'role', 'presentation' );
	} );

	// Add role="tab" and aria-controls with the corresponding tab panel ID to each <a> element.
	const tabLabels = Array.from(
		ref.querySelectorAll( '.wp-block-tabs__tab-label' )
	);
	const tabPanelToLabelIdMap = getTabPanelToLabelIdMap( tabLabels );
	tabLabels.forEach( ( label ) => {
		label.setAttribute( 'role', 'tab' );
		const tabPanelId = label.getAttribute( 'href' )?.substring( 1 );

		if ( tabPanelId ) {
			label.setAttribute( 'aria-controls', tabPanelId );
		}
	} );

	// Add role="tabpanel" and aria-labelledby with the corresponding tab label ID to each tab panel.
	const tabPanels = Array.from( ref.querySelectorAll( '.wp-block-tab' ) );
	tabPanels.forEach( ( panel ) => {
		panel.setAttribute( 'role', 'tabpanel' );
		const tabLabelledById = tabPanelToLabelIdMap.get( panel.id );
		if ( tabLabelledById ) {
			panel.setAttribute( 'aria-labelledby', tabLabelledById );
		}
	} );
}

// Interactivy store for the tabs block.
const { state, actions } = store( 'core/tabs', {
	state: {
		/**
		 * Whether the tab is the active tab.
		 *
		 * @type {boolean}
		 */
		get isActiveTab() {
			const context = getContext();
			const { attributes } = getElement();
			const tabIndexValue = attributes?.[ 'data-tab-index' ];
			const tabIndex = isNumeric( tabIndexValue )
				? parseInt( tabIndexValue, 10 )
				: 0;

			return context.activeTabIndex === tabIndex;
		},
		/**
		 * The value of the tabindex attribute for the tab label.
		 *
		 * @type {false|string}
		 */
		get tabindexLabelAttribute() {
			return state.isActiveTab ? false : '-1';
		},
		/**
		 * The value of the tabindex attribute for the tab panel.
		 *
		 * @type {false|string}
		 */
		get tabindexPanelAttribute() {
			return state.isActiveTab ? '0' : false;
		},
	},
	actions: {
		/**
		 * Handles the keydown event for the tab label.
		 *
		 * @param {KeyboardEvent} event The keydown event.
		 */
		handleTabKeyDown: ( event ) => {
			const { key, target } = event;

			if ( ! target ) {
				return;
			}

			const { ref } = getElement();
			const container = ref?.closest( '.wp-block-tabs' );
			const tabs = Array.from(
				container?.querySelectorAll( '.wp-block-tabs__tab-label' ) || []
			);

			const currentIndex = tabs.indexOf( target );
			let nextIndex = currentIndex;

			switch ( key ) {
				case 'ArrowRight':
					event.stopPropagation();
					event.preventDefault();

					// Loop back to the first tab if the last tab is reached.
					nextIndex = ( currentIndex + 1 ) % tabs.length;
					actions.setActiveTab( nextIndex );
					tabs[ nextIndex ]?.focus();
					break;
				case 'ArrowLeft':
					event.stopPropagation();
					event.preventDefault();

					// Loop back to the last tab if the first tab is reached.
					nextIndex =
						( currentIndex - 1 + tabs.length ) % tabs.length;
					actions.setActiveTab( nextIndex );
					tabs[ nextIndex ]?.focus();
					break;
				default:
					break;
			}
		},
		/**
		 * Handles the click event for the tab label.
		 *
		 * @param {MouseEvent} event The click event.
		 */
		handleTabClick: ( event ) => {
			event.preventDefault();

			const tabIndexValue =
				event.target?.getAttribute( 'data-tab-index' );
			const tabIndex = isNumeric( tabIndexValue )
				? parseInt( tabIndexValue, 10 )
				: null;

			if ( tabIndex !== null ) {
				actions.setActiveTab( tabIndex );
			}
		},
		/**
		 * Sets the active tab index.
		 *
		 * @param {number} tabIndex The index of the active tab.
		 */
		setActiveTab: ( tabIndex ) => {
			const context = getContext();
			context.activeTabIndex = tabIndex;
		},
	},
	callbacks: {
		/**
		 * Initializes the tabs block.
		 */
		init: () => {
			const { ref } = getElement();
			initTabs( ref );
		},
	},
} );
