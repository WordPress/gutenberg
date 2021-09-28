/*
This is a hacky fix for a text selection quirk in the UBE. 
It uses the 'setBaseAndExtent' method to reset the text 
selection when certain menu items are tapped. This then 
dismisses the text selection toolbar, preventing it from 
blocking access to buttons. See PR for further details: 
https://github.com/WordPress/gutenberg/pull/34668
*/
window.addEventListener(
	'focus',
	function () {
		const selected = document.getSelection();
		if (
			selected &&
			( window.document.activeElement.classList.contains(
				'components-dropdown-menu__menu-item'
			) ||
				window.document.activeElement.classList.contains(
					'components-menu-item__button'
				) )
		) {
			window.wpwebkit.hideTextSelectionContextMenu();
		}
	},
	true
);
