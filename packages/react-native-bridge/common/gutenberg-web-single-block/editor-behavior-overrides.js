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
		if ( ! selected || ! selected.toString() ) {
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
		// NOTE: The default behavior of the event is prevented
		// because it will be dispatched after the context menu
		// is hidden.
		if ( currentToggle ) {
			hideTextSelectionContextMenuListener = () => {
				currentToggle.click();
			};

			window.wpwebkit.hideTextSelectionContextMenu();
			event.preventDefault();
		}
	},
	true
);

let hideTextSelectionContextMenuListener;

window.onHideTextSelectionContextMenu = () => {
	if ( hideTextSelectionContextMenuListener ) {
		setTimeout( hideTextSelectionContextMenuListener, 0 );
		hideTextSelectionContextMenuListener = null;
	}
};
