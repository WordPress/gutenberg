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
	'focus',
	function ( event ) {
		const selected = document.getSelection();
		if (
			selected &&
			event.relatedTarget &&
			( window.document.activeElement.classList.contains(
				'components-dropdown-menu__menu-item'
			) ||
				window.document.activeElement.classList.contains(
					'components-menu-item__button'
				) )
		) {
			hideTextSelectionContextMenuListener = () => {
				event.relatedTarget.click();
			};
			window.wpwebkit.hideTextSelectionContextMenu();
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
