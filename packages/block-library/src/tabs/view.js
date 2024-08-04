/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

// Helper function to check for focusable elements
function isFocusable( element ) {
	return element.tabIndex >= 0;
}

function getFirstFocusableChild( element ) {
	if ( ! element ) {
		return null;
	}

	const treeWalker = document.createTreeWalker(
		element,
		window.NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: ( node ) =>
				isFocusable( node )
					? window.NodeFilter.FILTER_ACCEPT
					: window.NodeFilter.FILTER_SKIP,
		}
	);

	return treeWalker.nextNode();
}

function isNumeric( value ) {
	return ! isNaN( parseFloat( value ) );
}

function getTabPanelToLabelIdMap( tabLabels ) {
	if ( ! tabLabels ) {
		return new Map();
	}

	return new Map(
		[ ...tabLabels ].map( ( tabLabel ) => {
			const tabPanelId = tabLabel.getAttribute( 'href' )?.substring( 1 );
			const tabLabelId = tabLabel.getAttribute( 'id' );
			return [ tabPanelId, tabLabelId ];
		} )
	);
}

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
	const tabItems = ref.querySelectorAll( '.wp-block-tabs__list-item' );
	tabItems.forEach( ( item ) => {
		item.setAttribute( 'role', 'presentation' );
	} );

	// Add role="tab" and aria-controls with the corresponding tab panel ID to each <a> element.
	const tabLabels = ref.querySelectorAll( '.wp-block-tabs__tab-label' );
	const tabPanelToLabelIdMap = getTabPanelToLabelIdMap( tabLabels );
	tabLabels.forEach( ( label ) => {
		label.setAttribute( 'role', 'tab' );
		const tabPanelId = label.getAttribute( 'href' ).substring( 1 );
		label.setAttribute( 'aria-controls', tabPanelId );
	} );

	// Add role="tabpanel" and aria-labelledby with the corresponding tab label ID to each tab panel.
	const tabPanels = ref.querySelectorAll( '.wp-block-tab' );
	tabPanels.forEach( ( panel ) => {
		panel.setAttribute( 'role', 'tabpanel' );
		const tabLabelledById = tabPanelToLabelIdMap.get( panel.id );
		if ( tabLabelledById ) {
			panel.setAttribute( 'aria-labelledby', tabLabelledById );
		}
	} );
}

const { state, actions } = store( 'core/tabs', {
	state: {
		get isActiveTab() {
			const context = getContext();
			const { attributes } = getElement();
			const tabIndexValue = attributes?.[ 'data-tab-index' ];
			const tabIndex = isNumeric( tabIndexValue )
				? parseInt( tabIndexValue, 10 )
				: 0;

			return context.activeTabIndex === tabIndex;
		},
		get tabindexLabelAttribute() {
			return state.isActiveTab ? false : '-1';
		},
		get tabindexPanelAttribute() {
			const { attributes } = getElement();
			const panel = attributes?.id
				? document.getElementById( attributes.id )
				: null;
			const hasFocusable = panel
				? !! getFirstFocusableChild( panel )
				: false;
			return state.isActiveTab && ! hasFocusable ? '0' : false;
		},
	},
	actions: {
		handleTabKeyDown: ( event ) => {
			const { key } = event;
			const { ref } = getElement();
			const container = ref?.closest( '.wp-block-tabs' );
			const tabs = Array.from(
				container?.querySelectorAll( '.wp-block-tabs__tab-label' ) || []
			);
			const currentIndex = tabs.indexOf( event.target );

			let nextIndex = currentIndex;

			switch ( key ) {
				case 'ArrowRight':
					event.stopPropagation();
					event.preventDefault();

					nextIndex = ( currentIndex + 1 ) % tabs.length;
					actions.setActiveTab( nextIndex );
					tabs[ nextIndex ]?.focus();
					break;
				case 'ArrowLeft':
					event.stopPropagation();
					event.preventDefault();

					nextIndex =
						( currentIndex - 1 + tabs.length ) % tabs.length;
					actions.setActiveTab( nextIndex );
					tabs[ nextIndex ]?.focus();
					break;
				case 'ArrowDown':
					event.stopPropagation();
					event.preventDefault();

					const context = getContext();
					const panels = Array.from(
						container?.querySelectorAll( '.wp-block-tab' ) || []
					);
					const currentPanel = panels[ context.activeTabIndex ];
					const focusableChild =
						getFirstFocusableChild( currentPanel );

					if ( focusableChild ) {
						focusableChild.focus();
					} else {
						currentPanel?.focus();
					}
					break;
				default:
					break;
			}
		},
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
		setActiveTab: ( tabIndex ) => {
			const context = getContext();
			context.activeTabIndex = tabIndex;
		},
	},
	callbacks: {
		init: () => {
			const { ref } = getElement();
			initTabs( ref );
		},
	},
} );
