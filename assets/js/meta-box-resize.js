( function() {
	var observer;

	if ( ! window.MutationObserver || ! document.getElementById( 'post' ) || ! window.parent ) {
		return;
	}

	var previousWidth, previousHeight;

	function sendResize() {
		var form = document.getElementById( 'post' );
		var location = form.dataset.location;
		var newWidth = form.scrollWidth;
		var newHeight = form.scrollHeight;

		// Exit early if height has not been impacted.
		if ( newWidth === previousWidth && newHeight === previousHeight ) {
			return;
		}

		window.parent.postMessage( {
			action: 'resize',
			source: 'meta-box',
			location: location,
			width: newWidth,
			height: newHeight
		}, '*' );

		previousWidth = newWidth;
		previousHeight = newHeight;
	}

	observer = new MutationObserver( sendResize );
	observer.observe( document.getElementById( 'post' ), {
		attributes: true,
		attributeOldValue: true,
		characterData: true,
		characterDataOldValue: true,
		childList: true,
		subtree: true
	} );

	window.addEventListener( 'load', sendResize, true );
	window.addEventListener( 'resize', sendResize, true );

	sendResize();
} )();
