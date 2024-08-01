/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

function getTabPanelToLabelIdMap( tabLabels ) {
	if ( ! tabLabels ) {
		return new Map();
	}

	return new Map(
		[ ...tabLabels ].map( ( tabLabel ) => {
			const tabPanelId = tabLabel.getAttribute( 'href' ).substring( 1 );
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

store( 'core/tabs', {
	actions: {
		setActiveTab: ( index ) => {
			const context = getContext();
			context.activeTab = index;
		},
	},
	callbacks: {
		init: () => {
			const { ref } = getElement();
			initTabs( ref );
		},
	},
} );
