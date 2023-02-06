// Listeners for native context menu visibility changes.
let isContextMenuVisible = false;
const hideContextMenuListeners = [];

window.onShowContextMenu = () => {
	isContextMenuVisible = true;
};
window.onHideContextMenu = () => {
	isContextMenuVisible = false;
	while ( hideContextMenuListeners.length > 0 ) {
		const listener = hideContextMenuListeners.pop();
		listener();
	}
};

/*
This is a fix for a text selection quirk in the UBE. 
It notifies the Android app to dismiss the text selection 
context menu when certain menu items are tapped. This is 
done via the 'hideTextSelectionContextMenu' method, which
is sent back to the Android app, where the dismissal is
then handle. See PR for further details: 
https://github.com/WordPress/gutenberg/pull/34668
*/
window.addEventListener(
	'click',
	( event ) => {
		const selected = document.getSelection();
		if ( ! isContextMenuVisible || ! selected || ! selected.toString() ) {
			return;
		}

		// Check if the event is triggered by a dropdown
		// toggle button.
		const dropdownToggles = document.querySelectorAll(
			'.components-dropdown-menu > button'
		);
		let currentToggle;
		for ( const node of dropdownToggles.values() ) {
			if ( node.contains( event.target ) ) {
				currentToggle = node;
				break;
			}
		}

		// Hide text selection context menu when the click
		// is triggered by a dropdown toggle.
		//
		// NOTE: The event propagation is prevented because
		// it will be dispatched after the context menu
		// is hidden.
		if ( currentToggle ) {
			event.stopPropagation();
			hideContextMenuListeners.push( () => currentToggle.click() );
			window.wpwebkit.hideTextSelectionContextMenu();
		}
	},
	true
);
