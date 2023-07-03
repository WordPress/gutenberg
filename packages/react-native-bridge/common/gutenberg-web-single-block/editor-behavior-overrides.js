/**
 * Detects whether the user agent is Android.
 *
 * @return {boolean} Whether the user agent is Android.
 */
function isAndroid() {
	return !! window.navigator.userAgent.match( /Android/ );
}

/**
 * This is a fix for a text selection quirk in the UBE. It notifies the Android
 * app to dismiss the text selection context menu when certain menu items are
 * tapped. This is done via the 'hideTextSelectionContextMenu' method, which
 * is sent back to the Android app, where the dismissal is then handle.
 *
 * @return {void}
 * @see https://github.com/WordPress/gutenberg/pull/34668
 */
function manageTextSelectonContextMenu() {
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

	window.addEventListener(
		'click',
		( event ) => {
			const selected = document.getSelection();
			if (
				! isContextMenuVisible ||
				! selected ||
				! selected.toString()
			) {
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
}

if ( isAndroid() ) {
	manageTextSelectonContextMenu();
}

function _toggleBlockSelectedClass( isBlockSelected ) {
	const editor = document.querySelector( '#editor' );
	if ( isBlockSelected ) {
		editor.classList.add( 'is-block-selected' );
	} else {
		editor.classList.remove( 'is-block-selected' );
	}
}

/** @typedef {import('@wordpress/data').WPDataRegistry} WPDataRegistry */

/**
 * Toggle the `is-block-selected` class on the editor container when a block is
 * selected. This is used to hide the sidebar toggle button when a block is not
 * selected.
 *
 * @param {WPDataRegistry} registry Data registry.
 * @return {WPDataRegistry} Modified data registry.
 */
function toggleBlockSelectedStyles( registry ) {
	return {
		dispatch: ( namespace ) => {
			const namespaceName =
				typeof namespace === 'string' ? namespace : namespace.name;
			const actions = { ...registry.dispatch( namespaceName ) };

			const originalSelectBlockAction = actions.selectBlock;
			actions.selectBlock = ( ...args ) => {
				_toggleBlockSelectedClass( true );
				return originalSelectBlockAction( ...args );
			};

			const originalClearSelectedBlockAction = actions.clearSelectedBlock;
			actions.clearSelectedBlock = ( ...args ) => {
				_toggleBlockSelectedClass( false );
				return originalClearSelectedBlockAction( ...args );
			};

			return actions;
		},
	};
}

window.wp.data.use( toggleBlockSelectedStyles );

// The editor-canvas iframe relies upon `srcdoc`, which does not trigger a
// `load` event. Thus, we must poll for the iframe to be ready.
let overrideAttempts = 0;
const overrideInterval = setInterval( () => {
	overrideAttempts++;
	const overrideStyles = document.querySelector( '#editor-style-overrides' );
	const canvasIframe = document.querySelector(
		'iframe[name="editor-canvas"]'
	);

	if (
		overrideStyles &&
		canvasIframe &&
		canvasIframe.contentDocument &&
		canvasIframe.contentDocument.documentElement
	) {
		clearInterval( overrideInterval );

		// Clone the editor styles so that they can be copied to the iframe, as
		// elements within an iframe cannot be styled from the parent context.
		const overrideStylesClone = overrideStyles.cloneNode( true );
		overrideStylesClone.id = 'editor-styles-overrides-2';
		// Append to document rather than the head, as React will remove this
		// mutation.
		canvasIframe.contentDocument.documentElement.appendChild(
			overrideStylesClone
		);

		// Select the first block.
		const { blockEditorSelect, blockEditorDispatch } =
			window.getBlockEditorStore();
		const firstBlock = blockEditorSelect.getBlocks()[ 0 ];
		if ( firstBlock ) {
			blockEditorDispatch.selectBlock( firstBlock.clientId );
		}
	}

	// Safeguard against an infinite loop.
	if ( overrideAttempts > 100 ) {
		clearInterval( overrideInterval );
	}
}, 300 );
